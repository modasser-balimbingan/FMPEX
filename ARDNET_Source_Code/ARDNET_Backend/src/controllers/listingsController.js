
const pool = require('../config/database');

// FEATURE: Attach saved photos to listings returned by the API.
async function attachPhotos(listings) {
  if (!listings.length) return listings;

  const listingIds = listings.map((listing) => listing.listing_id);

  const result = await pool.query(
    `
      SELECT
        photo_id,
        listing_id,
        file_name AS original_name,
        file_path AS photo_url
      FROM produce_photos
      WHERE listing_id = ANY($1::int[])
      ORDER BY photo_id ASC
    `,
    [listingIds]
  );

  const photosByListing = new Map();

  for (const photo of result.rows) {
    const listingId = String(photo.listing_id);

    if (!photosByListing.has(listingId)) {
      photosByListing.set(listingId, []);
    }

    photosByListing.get(listingId).push(photo);
  }

  return listings.map((listing) => ({
    ...listing,
    photos: photosByListing.get(String(listing.listing_id)) || [],
  }));
}

// GET /api/listings
// FEATURE: Return active listings by default, with their saved photos.
exports.getListings = async (req, res) => {
  try {
    const { status, location, produce, category_id } = req.query;

    let query = `
      SELECT
        pl.listing_id,
        pl.user_id,
        pl.category_id,
        pc.category_name,
        pl.produce_name,
        pl.description,
        pl.quantity,
        pl.unit,
        pl.asking_price,
        pl.location,
        pl.status,
        pl.created_at,
        pl.updated_at,
        u.user_name AS farmer_name
      FROM produce_listings pl
      JOIN produce_categories pc
        ON pl.category_id = pc.category_id
      JOIN users u
        ON pl.user_id = u.user_id
    `;

    const conditions = [];
    const params = [];

    // FEATURE: Apply filters while keeping SQL parameters safe.
    if (status) {
      conditions.push(`pl.status = $${params.length + 1}`);
      params.push(status);
    } else {
      conditions.push(`pl.status = 'Active'`);
    }

    if (location) {
      conditions.push(`pl.location ILIKE $${params.length + 1}`);
      params.push(`%${location}%`);
    }

    if (produce) {
      conditions.push(`pl.produce_name ILIKE $${params.length + 1}`);
      params.push(`%${produce}%`);
    }

    if (category_id) {
      conditions.push(`pl.category_id = $${params.length + 1}`);
      params.push(category_id);
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY pl.created_at DESC`;

    const result = await pool.query(query, params);

    // FEATURE: Include saved photos in each listing response.
    const listingsWithPhotos = await attachPhotos(result.rows);
    res.json(listingsWithPhotos);
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// GET /api/listings/:id
// FEATURE: Return one listing with its saved photos.
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT
          pl.listing_id,
          pl.user_id,
          pl.category_id,
          pc.category_name,
          pl.produce_name,
          pl.description,
          pl.quantity,
          pl.unit,
          pl.asking_price,
          pl.location,
          pl.status,
          pl.created_at,
          pl.updated_at,
          u.user_name AS farmer_name
        FROM produce_listings pl
        JOIN produce_categories pc
          ON pl.category_id = pc.category_id
        JOIN users u
          ON pl.user_id = u.user_id
        WHERE pl.listing_id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const [listingWithPhotos] = await attachPhotos(result.rows);
    res.json(listingWithPhotos);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};

// POST /api/listings
// Farmer only.
// FEATURE: Create a listing and save uploaded photo metadata.
exports.createListing = async (req, res) => {
  try {
    const {
      category_id,
      produce_name,
      description,
      quantity,
      unit,
      asking_price,
      location,
      status,
    } = req.body;

    const user_id = req.user.id;

    if (description != null && (typeof description !== 'string' || description.trim().length > 2000)) {
      return res.status(400).json({ error: 'Description must be text with no more than 2,000 characters.' });
    }

    // FEATURE: Validate required listing fields.
    if (
      !category_id ||
      !produce_name ||
      quantity === undefined ||
      !unit ||
      !location
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: category_id, produce_name, quantity, unit, location',
      });
    }

    if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({
        error: 'Quantity must be greater than zero',
      });
    }

    // FEATURE: Validate optional asking price.
    if (
      asking_price !== undefined &&
      asking_price !== null &&
      asking_price !== '' &&
      (!Number.isFinite(Number(asking_price)) || Number(asking_price) <= 0)
    ) {
      return res.status(400).json({
        error: 'Asking price must be greater than zero',
      });
    }

    // FEATURE: Ensure the selected category exists.
    const categoryResult = await pool.query(
      `SELECT category_id FROM produce_categories WHERE category_id = $1`,
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: 'Produce category not found' });
    }

    const result = await pool.query(
      `
        INSERT INTO produce_listings
          (
            user_id,
            category_id,
            produce_name,
            description,
            quantity,
            unit,
            asking_price,
            location,
            status,
            created_at
          )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `,
      [
        user_id,
        category_id,
        produce_name.trim(),
        typeof description === 'string' ? description.trim() || null : null,
        Number(quantity),
        unit,
        asking_price === undefined || asking_price === ''
          ? null
          : asking_price,
        location.trim(),
        status || 'Active',
      ]
    );

    const listing = result.rows[0];

    // FEATURE: Save uploaded photo metadata linked to the new listing.
    for (const file of req.files || []) {
      await pool.query(
        `
          INSERT INTO produce_photos (listing_id, file_name, file_path)
          VALUES ($1, $2, $3)
        `,
        [
          listing.listing_id,
          file.originalname,
          `/uploads/produce/${file.filename}`,
        ]
      );
    }

    // FEATURE: Return the new listing with all saved photos.
    const [listingWithPhotos] = await attachPhotos([listing]);

    res.status(201).json({
      message: 'Listing created successfully',
      listing: listingWithPhotos,
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

// PUT /api/listings/:id
// FEATURE: Update listing fields and save any newly uploaded photos.
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      produce_name,
      description,
      quantity,
      unit,
      asking_price,
      location,
      status,
    } = req.body;

    const user_id = req.user.id;
    const user_role = req.user.role;

    if (description != null && (typeof description !== 'string' || description.trim().length > 2000)) {
      return res.status(400).json({ error: 'Description must be text with no more than 2,000 characters.' });
    }

    // FEATURE: Find the listing and verify it exists.
    const existing = await pool.query(
      `SELECT user_id FROM produce_listings WHERE listing_id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // FEATURE: Allow only the listing owner or an administrator to edit it.
    // String conversion avoids number-vs-string ID comparison issues.
    const ownerId = String(existing.rows[0].user_id);

    if (ownerId !== String(user_id) && user_role !== 'admin') {
      return res.status(403).json({
        error: 'Not authorized to update this listing',
      });
    }

    if (
      quantity !== undefined &&
      (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0)
    ) {
      return res.status(400).json({
        error: 'Quantity must be greater than zero',
      });
    }

    if (
      asking_price !== undefined &&
      asking_price !== null &&
      asking_price !== '' &&
      (!Number.isFinite(Number(asking_price)) || Number(asking_price) <= 0)
    ) {
      return res.status(400).json({
        error: 'Asking price must be greater than zero',
      });
    }

    const result = await pool.query(
      `
        UPDATE produce_listings
        SET
          category_id = COALESCE($1, category_id),
          produce_name = COALESCE($2, produce_name),
          description = CASE WHEN $11::boolean THEN $3 ELSE description END,
          quantity = COALESCE($4, quantity),
          unit = COALESCE($5, unit),
          asking_price = CASE WHEN $10::boolean THEN $6 ELSE asking_price END,
          location = COALESCE($7, location),
          status = COALESCE($8, status),
          updated_at = NOW()
        WHERE listing_id = $9
        RETURNING *
      `,
      [
        category_id || null,
        produce_name || null,
        typeof description === 'string' ? description.trim() || null : null,
        quantity === undefined ? null : Number(quantity),
        unit || null,
        asking_price === undefined || asking_price === ''
          ? null
          : asking_price,
        location || null,
        status || null,
        id,
        Object.prototype.hasOwnProperty.call(req.body, 'asking_price'),
        Object.prototype.hasOwnProperty.call(req.body, 'description'),
      ]
    );

    const listing = result.rows[0];

    // FEATURE: Save newly uploaded photos when editing a listing.
    for (const file of req.files || []) {
      await pool.query(
        `
          INSERT INTO produce_photos (listing_id, file_name, file_path)
          VALUES ($1, $2, $3)
        `,
        [
          listing.listing_id,
          file.originalname,
          `/uploads/produce/${file.filename}`,
        ]
      );
    }

    // FEATURE: Return the updated listing and all of its saved photos.
    const [listingWithPhotos] = await attachPhotos([listing]);

    res.json({
      message: 'Listing updated successfully',
      listing: listingWithPhotos,
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
};

// DELETE /api/listings/:id
// FEATURE: Delete a listing after verifying ownership.
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    const existing = await pool.query(
      `SELECT user_id FROM produce_listings WHERE listing_id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const ownerId = String(existing.rows[0].user_id);

    if (ownerId !== String(user_id) && user_role !== 'admin') {
      return res.status(403).json({
        error: 'Not authorized to delete this listing',
      });
    }

    // FEATURE: Delete photo metadata first to avoid FK errors when CASCADE isn't configured.
    await pool.query(
      `DELETE FROM produce_photos WHERE listing_id = $1`,
      [id]
    );

    await pool.query(
      `DELETE FROM produce_listings WHERE listing_id = $1`,
      [id]
    );

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
};

// GET /api/listings/my-listings
// FEATURE: Return the current farmer's listings with saved photos.
exports.getMyListings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `
        SELECT
          pl.listing_id,
          pl.user_id,
          pl.category_id,
          pc.category_name,
          pl.produce_name,
          pl.description,
          pl.quantity,
          pl.unit,
          pl.asking_price,
          pl.location,
          pl.status,
          pl.created_at,
          pl.updated_at
        FROM produce_listings pl
        JOIN produce_categories pc
          ON pl.category_id = pc.category_id
        WHERE pl.user_id = $1
        ORDER BY pl.created_at DESC
      `,
      [user_id]
    );

    const listingsWithPhotos = await attachPhotos(result.rows);
    res.json(listingsWithPhotos);
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
};
