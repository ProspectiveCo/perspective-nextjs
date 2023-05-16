import React from "react";
import "@finos/perspective-viewer/dist/css/themes.css";
import type { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";

export default function Home() {
    const ref = React.useRef<HTMLPerspectiveViewerElement>(null);
    React.useEffect(() => {
        Promise.all([
            import("@finos/perspective-viewer"),
            import("@finos/perspective-viewer-datagrid"),
            import("@finos/perspective-viewer-d3fc"),
            import("@finos/perspective"),

            // @ts-ignore
            import("superstore-arrow/superstore.arrow"),
        ]).then(([_, __, ___, perspective, arr]) => {
            const worker = perspective.default.shared_worker();
            const table = worker.table(arr.default.slice());
            ref.current!.load(table);
        })
    }, [ref]);

    return (<perspective-viewer ref={ref}></perspective-viewer>);
}
