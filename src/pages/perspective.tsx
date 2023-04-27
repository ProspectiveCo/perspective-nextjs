import React, { FC } from "react";

import "@finos/perspective-viewer/dist/css/themes.css";

import { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";
import { PerspectiveWorker, Table, TableData, TableOptions } from "@finos/perspective";
import { PerspectiveViewerConfig } from "@finos/perspective-viewer/dist/esm/viewer";

type PerspectiveViewerProps = JSX.IntrinsicElements['perspective-viewer'] & {
    table?: Table,
    theme?: string,
    restoreConfig?: PerspectiveViewerConfig & { [rest: string]: any },
    // title: string | null,
    // [rest: string]: any,
}

type PerspectiveDefault = typeof import('@finos/perspective').default;

// export const cleanupTable = (table?: Table) => {
//     React.useEffect(() => {
//         if (table) {
//             return () => {
//                 table.delete();
//             }
//         }
//     }, [table]);
// };

export const useTable = (data?: TableData, worker?: PerspectiveWorker, tableOpts?: TableOptions, restoreConfig?: any): Table | undefined => {
    const [table, setTable] = React.useState<Table | undefined>()

    React.useEffect(() => {
        if (!data) {
            return;
        }

        const abortController = new AbortController()
        const signal = abortController.signal

        if (worker) {
            (async () => {
                console.log("Creating table");
                const table = await worker.table(data, tableOpts);
                if (signal.aborted) {
                    await table.delete()
                } else {
                    setTable(table)
                }
            })();
            return () => {
                abortController.abort()
                if (table) {
                    table.delete()
                }
            }
        }
    }, [worker, typeof data])

    React.useEffect(() => {
        if (table) {
            (async () => {
                await table.clear();
                if (data) {
                    await table.update(data);
                }
            })();
        }
    }, [data])

    return table;
}


export const useWorker = (): PerspectiveWorker | undefined => {
    const [perspective, setPerspective] = React.useState<PerspectiveDefault | undefined>();
    const [worker, setWorker] = React.useState<PerspectiveWorker | undefined>();

    React.useEffect(() => {
        Promise.all([
            import("@finos/perspective-viewer"),
            import("@finos/perspective-viewer-datagrid"),
            // @ts-ignore
            import("@finos/perspective-viewer-d3fc"),
            import("@finos/perspective")
        ]).then(([_, __, ___, perspective]) => {
            setPerspective(perspective.default);
        })
    }, []);

    React.useEffect(() => {
        if (perspective) {
            setWorker(perspective.worker());

            return () => {
                worker?.terminate();
            }
        }
    }, [perspective]);

    return worker;
}

export const PerspectiveViewer: FC<PerspectiveViewerProps> = (props: PerspectiveViewerProps) => {
    const ref = React.useRef<HTMLPerspectiveViewerElement>(null);
    React.useEffect(() => {
        (async () => {
            if (props.table) {
                await ref.current!.load(props.table);
                if (props.restoreConfig) {
                    await ref.current!.restore(props.restoreConfig);
                }
            }
        })()
        return () => {
            ref.current!.reset(true);
        };
    }, [props.table]);

    return <perspective-viewer ref={ref} {...props} />;
}