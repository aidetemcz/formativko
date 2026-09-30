import { Fragment } from "react";
import { boldParts, textBlocks } from "@/lib/buddyText";

function Inline({ text }: { text: string }) {
  return (
    <>
      {boldParts(text).map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-medium">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** An answer from Buddy, with its light Markdown turned into paragraphs and lists. */
export function BuddyText({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-[0.9375rem] leading-relaxed">
      {textBlocks(text).map((b, i) =>
        b.type === "p" ? (
          <p key={i}>
            <Inline text={b.text} />
          </p>
        ) : b.type === "h" ? (
          <p key={i} className="font-medium">
            <Inline text={b.text} />
          </p>
        ) : b.type === "ul" ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <ol key={i} className="list-decimal space-y-1 pl-5">
            {b.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} />
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}
