


import React from "react";

import "@finos/perspective-viewer/dist/css/themes.css";

import type { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";

export default function PerspectiveViewer() {

    const ref = React.useRef<HTMLPerspectiveViewerElement>(null);

    React.useEffect(() => {
        Promise.all([
            import("@finos/perspective-viewer"),
            import("@finos/perspective-viewer-datagrid"),

            // @ts-ignore
            import("@finos/perspective-viewer-d3fc"),

            // @ts-ignore
            import("@finos/perspective/dist/esm/perspective.js")
        ]).then(([_, __, ___, perspective]) => {
            const worker = perspective.worker();
            const table = worker.table({"x": [1,2,3,4,5]});
            ref.current!.load(table);
        })
    });

    return (<perspective-viewer ref={ref}></perspective-viewer>);
}