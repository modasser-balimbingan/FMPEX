export default function Card({ className = '', children, ...props }) {
  return <article className={`card ${className}`} {...props}>{children}</article>;
}
