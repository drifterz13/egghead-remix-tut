import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { getPostListings } from "~/models/post.server";
import { requireUserAdmin } from "~/session.server";

type LoaderData = {
  posts: Awaited<ReturnType<typeof getPostListings>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserAdmin(request);
  const posts = await getPostListings();

  return json<LoaderData>({ posts });
};

export default function AdminRoute() {
  const { posts } = useLoaderData<LoaderData>();

  return (
    <div className="grid grid-cols-3">
      <nav className="col-span-1">
        <h1>Admin Posts</h1>
        {posts.map((post) => (
          <p key={post.slug}>
            <Link
              to={post.slug}
              prefetch="intent"
              className="text-blue-500 underline"
            >
              {post.title}
            </Link>
          </p>
        ))}
      </nav>
      <aside className="col-span-2">
        <Outlet />
      </aside>
    </div>
  );
}
