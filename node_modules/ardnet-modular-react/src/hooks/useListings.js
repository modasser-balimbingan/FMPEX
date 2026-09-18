import { useDispatch, useSelector } from 'react-redux';
import { addListing, updateListing, deleteListing, markListingSold, toggleListingStatus, syncFarmerContact } from '../redux/slices/listingsSlice';

export function useListings() {
  const listings = useSelector((state) => state.listings);
  const dispatch = useDispatch();

  return {
    listings,
    add: (listing) => dispatch(addListing(listing)),
    update: (listing) => dispatch(updateListing(listing)),
    remove: (id) => dispatch(deleteListing(id)),
    markSold: (id) => dispatch(markListingSold(id))
    ,toggleStatus: (id) => dispatch(toggleListingStatus(id)),
    syncContact: (farmer, contact, email) => dispatch(syncFarmerContact({ farmer, contact, email }))
  };
}
