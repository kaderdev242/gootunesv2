import { Fragment, type ReactNode } from "react";
import type { BlogDoc, BlogMark, BlogNode } from "@/lib/blog/content";

/**
 * Rendu d'un article : chaque bloc Tiptap devient un élément React.
 * Aucun HTML brut n'est injecté ; seuls les blocs connus sont affichés.
 */

function withMarks(text: string, marks: BlogMark[] | undefined, key: number): ReactNode {
  let node: ReactNode = text;
  for (const mark of marks ?? []) {
    switch (mark.type) {
      case "bold":
        node = <strong>{node}</strong>;
        break;
      case "italic":
        node = <em>{node}</em>;
        break;
      case "underline":
        node = <u>{node}</u>;
        break;
      case "strike":
        node = <s>{node}</s>;
        break;
      case "code":
        node = <code>{node}</code>;
        break;
      case "link": {
        const external = !mark.attrs.href.startsWith("/");
        node = (
          <a
            href={mark.attrs.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
          >
            {node}
          </a>
        );
        break;
      }
    }
  }
  return <Fragment key={key}>{node}</Fragment>;
}

function renderNodes(nodes: BlogNode[] | undefined): ReactNode[] {
  return (nodes ?? []).map((n, i) => renderNode(n, i));
}

function renderNode(node: BlogNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return withMarks(node.text, node.marks, key);
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "paragraph":
      return <p key={key}>{renderNodes(node.content)}</p>;
    case "heading":
      return node.attrs.level === 2 ? (
        <h2 key={key}>{renderNodes(node.content)}</h2>
      ) : (
        <h3 key={key}>{renderNodes(node.content)}</h3>
      );
    case "bulletList":
      return <ul key={key}>{renderNodes(node.content)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderNodes(node.content)}</ol>;
    case "listItem":
      return <li key={key}>{renderNodes(node.content)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderNodes(node.content)}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{renderNodes(node.content)}</code>
        </pre>
      );
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key} src={node.attrs.src} alt={node.attrs.alt} loading="lazy" decoding="async" />
      );
    default:
      return null;
  }
}

export function BlogContent({ doc }: { doc: BlogDoc }) {
  return <div className="blog-prose">{renderNodes(doc.content)}</div>;
}
