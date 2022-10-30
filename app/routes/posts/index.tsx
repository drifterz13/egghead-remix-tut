import { Link, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { getPostListings } from "~/models/post.server";
import { useOptionalAdminUser } from "~/utils";

type LoaderData = {
  posts: Awaited<ReturnType<typeof getPostListings>>;
};

export const loader: LoaderFunction = async () => {
  const posts = await getPostListings();

  return json<LoaderData>({ posts });
};

export default function PostsRoute() {
  const { posts } = useLoaderData<LoaderData>();

  const admin = useOptionalAdminUser();

  return (
    <section>
      <h1>Posts</h1>
      {posts.map((post) => (
        <p key={post.slug}>
          <Link
            to={post.slug}
            prefetch="render"
            className="text-blue-500 underline"
          >
            {post.title}
          </Link>
        </p>
      ))}

      {admin ? (
        <Link to="admin" className="text-blue-500 underline">
          Admin
        </Link>
      ) : null}
    </section>
  );
}
