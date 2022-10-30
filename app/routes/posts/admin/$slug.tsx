import { Post } from "@prisma/client";
import {
  Form,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
  useTransition,
} from "@remix-run/react";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import {
  createPost,
  deletePost,
  getPost,
  updatePost,
} from "~/models/post.server";
import { requireUserAdmin } from "~/session.server";

type LoaderData = {
  post?: Post;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireUserAdmin(request);
  invariant(params.slug, "slug is required.");

  if (params.slug === "new") {
    return json<LoaderData>({});
  }

  const post = await getPost(params.slug);
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  return json<LoaderData>({ post });
};

type ActionData =
  | {
      title: null | string;
      slug: null | string;
      markdown: null | string;
    }
  | undefined;

export const action: ActionFunction = async ({ request, params }) => {
  await requireUserAdmin(request);
  invariant(params.slug, "slug is required.");

  const formData = await request.formData();
  if (formData.get("intent") === "delete") {
    await deletePost(params.slug);
    return redirect("/posts/admin");
  }

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors = {
    title: title ? null : "Title is required.",
    slug: slug ? null : "Slug is required.",
    markdown: markdown ? null : "Markdown is required.",
  };

  const hasErrors = Object.values(errors).some((error) => !!error);
  if (hasErrors) {
    return json<ActionData>(errors);
  }

  invariant(typeof title === "string", "title must be a string.");
  invariant(typeof slug === "string", "slug must be a string.");
  invariant(typeof markdown === "string", "markdown must be a string.");

  if (params.slug === "new") {
    await createPost({ title, slug, markdown });
  } else {
    await updatePost(params.slug, { title, slug, markdown });
  }
  return redirect("/posts/admin");
};

const inputClassName = `bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`;

export default function NewPostRoute() {
  const data = useLoaderData<LoaderData>();
  const errors = useActionData<ActionData>();
  const transition = useTransition();
  const isCreating = Boolean(
    transition.submission?.formData.get("intent") === "create"
  );
  const isUpdating = Boolean(
    transition.submission?.formData.get("intent") === "update"
  );
  const isDeleting = Boolean(
    transition.submission?.formData.get("intent") === "delete"
  );

  const isNewPost = !data.post;

  return (
    <Form method="post" key={data.post?.slug ?? "new"}>
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-500">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={data.post?.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug ? (
            <em className="text-red-500">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={data.post?.slug}
          />
        </label>
      </p>
      <p>
        <label>
          Post Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-500">{errors.markdown}</em>
          ) : null}
          <textarea
            rows={8}
            name="markdown"
            className={inputClassName}
            defaultValue={data.post?.markdown}
          />
        </label>
      </p>

      <div className="flex justify-end gap-4">
        {isNewPost ? null : (
          <button
            type="submit"
            name="intent"
            value="delete"
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-300"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting.." : "Delete Post"}
          </button>
        )}
        <button
          type="submit"
          name="intent"
          value={isNewPost ? "create" : "update"}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
          disabled={isCreating || isUpdating}
        >
          {(() => {
            if (isNewPost) {
              return isCreating ? "Creating..." : "Create Post";
            }

            return isUpdating ? "Updateing..." : "Update Post";
          })()}
        </button>
      </div>
    </Form>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 404) {
    return (
      <div>{`Uh oh! The page that use slug "${params.slug}" is not exist.`}</div>
    );
  }

  throw new Error(`The error status: "${caught.status}" is not supported.`);
}

export function ErrorBoundary({ error }: { error: unknown }) {
  if (error instanceof Error) {
    return (
      <div className="text-red-500">
        Oh no, Something went wrong!
        <pre>{error.message}</pre>
      </div>
    );
  }

  return <div className="text-red-500">Oh no, Something went wrong!</div>;
}
