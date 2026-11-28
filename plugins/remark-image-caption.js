// @ts-check

/** @typedef {import('mdast').Paragraph} Paragraph */
/** @typedef {import('mdast').PhrasingContent} PhrasingContent */

/** @param {PhrasingContent} node */
const isBlank = (node) => node.type === "text" && !node.value.trim();

/**
 * @param {import('mdast').Image} image
 * @returns {Paragraph}
 */
function figure(image) {
  const caption = image.title ?? "";
  return {
    type: "paragraph",
    data: { hName: "figure" },
    children: [
      { ...image, title: image.alt || null },
      /** @type {never} */ ({
        type: "imageCaption",
        data: { hName: "figcaption" },
        children: [{ type: "text", value: caption }],
      }),
    ],
  };
}

/** @param {Paragraph} paragraph */
function split(paragraph) {
  const { children } = paragraph;
  if (
    !children.every((child) => child.type === "image" || isBlank(child)) ||
    !children.some((child) => child.type === "image" && child.title)
  ) {
    return null;
  }
  /** @type {Paragraph[]} */
  const nodes = [];
  /** @type {PhrasingContent[]} */
  let run = [];
  const flush = () => {
    while (run.length && isBlank(run[run.length - 1])) run.pop();
    if (run.length) nodes.push({ type: "paragraph", children: run });
    run = [];
  };
  for (const child of children) {
    if (child.type === "image" && child.title) {
      flush();
      nodes.push(figure(child));
    } else if (run.length || !isBlank(child)) {
      run.push(child);
    }
  }
  flush();
  return nodes;
}

/**
 * Renders an image written alone on its line as `![alt](src "title")` as a
 * figure: the title becomes the caption below the image and the alt text
 * becomes the hover tooltip.
 * @returns {(root: import('mdast').Root) => void}
 */
module.exports = function remarkImageCaption() {
  /** @param {import('mdast').Parent} parent */
  const walk = (parent) => {
    for (let i = 0; i < parent.children.length; i++) {
      const node = parent.children[i];
      if (node.type === "paragraph") {
        const nodes = split(node);
        if (nodes) {
          parent.children.splice(i, 1, ...nodes);
          i += nodes.length - 1;
        }
      } else if ("children" in node) {
        walk(node);
      }
    }
  };
  return (root) => walk(root);
};
