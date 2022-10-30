import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { getPost } from "~/models/post.server";
import { marked } from "marked";
import invariant from "tiny-invariant";

export const loader: LoaderFunction = async ({ params }) => {
  const { slug } = params;
  invariant(slug, "slug is required.");
  const post = await getPost(slug);
  invariant(post, "post not found.");
  const html = marked(post.markdown);

  return json({ post, html });
};

export default function PostRoute() {
  const { post, html } = useLoaderData();
  return (
    <main>
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }}></div>
    </main>
  );
}
