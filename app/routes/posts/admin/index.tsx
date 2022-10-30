import { Link } from "@remix-run/react";

export default function AdminIndexRoute() {
  return (
    <p className="text-center">
      <Link to="new" className="text-blue-500 underline">
        Create a post
      </Link>
    </p>
  );
}
