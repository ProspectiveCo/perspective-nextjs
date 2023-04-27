import { PerspectiveViewer, useWorker } from './perspective';
import React from 'react';
import { Table } from '@finos/perspective';
import { FlateError } from 'fflate';
import { PerspectiveViewerConfig } from '@finos/perspective-viewer/dist/esm/viewer';

import SCHEMA from "./schema.json";

const federalDataConfig: PerspectiveViewerConfig & { [k: string]: any } = { "plugin": "Treemap", "plugin_config": {}, "settings": true, "theme": "Pro Light", "title": null, "group_by": ["awarding_agency_name"], "split_by": [], "columns": ["total_dollars_obligated", "current_total_value_of_award"], "filter": [], "sort": [["award_id_piid", "desc"]], "expressions": [], "aggregates": {} };

const fetchPartialData = async (
    url: string,
    start: number,
    end: number
): Promise<Response> => {
    console.log(`bytes=${start}-${end}`);
    const headers = new Headers({
        Range: `bytes=${start}-${end}`
    });

    const response = await fetch(url, { headers });

    if (!response.ok && response.status !== 206) {
        throw new Error(`Error fetching ${url}: ${response.statusText}`);
    }

    return response;
};

export default function Home() {
    const worker = useWorker();
    const [table, setTable] = React.useState<Table | undefined>();
    const [fileName, setFileName] = React.useState<string>('/test.csv');
    React.useEffect(() => {
        const file = new URLSearchParams(window.location.search).get('file');
        if (file) {
            setFileName(file);
        }
    }, []);

    React.useEffect(() => {
        if (worker) {
            (async () => {
                const fflate = await import('fflate');

                const table = await worker.table(SCHEMA);
                setTable(table);

                // const URL = "FY2022_All_Contracts_Full_20230408_2.csv";
                const URL = "smaller-test.csv.gz";
                let chunk_size = 500_000;
                let start = 0;
                let end = chunk_size;
                let buffer = "";
                let headers: string | undefined = undefined;


                const decoder = new TextDecoder();


                let iterations = 0;
                let running = true;

                let total = 0;

                let pendingUpdates: Promise<void>[] = [];


                const gzipStream = new fflate.AsyncGunzip(async (err: FlateError | null, data: Uint8Array, final: boolean) => {
                    if (err) {
                        console.error(err);
                        gzipStream.terminate();
                    }

                    const bytes = data.buffer;
                    buffer += decoder.decode(bytes, { stream: true });

                    let csv = buffer.split("\n");
                    if (headers === undefined) {
                        if (csv.length === 1) {
                            return;
                        } else {
                            headers = csv.shift();
                        }
                    }

                    if (csv.length >= 1) {
                        total += csv.length;
                        buffer = csv.pop()!;
                        pendingUpdates.push(table.update(headers + "\n" + csv.join("\n")) as unknown as Promise<void>);
                    } else {
                        console.error("No data in chunk");
                    }

                    if (final) {
                        console.log("FINAL", total);
                    }
                });

                while (running) {
                    iterations++;
                    const response = await fetchPartialData(URL, start, end - 1);
                    const bytes = await response.arrayBuffer();
                    start += bytes.byteLength;
                    end = start + chunk_size;

                    if (end - start !== bytes.byteLength) {
                        console.log(`Expected ${end - start} bytes, got ${bytes.byteLength} bytes`);
                        gzipStream.push(new Uint8Array(bytes), true);
                        running = false;
                    } else {
                        gzipStream.push(new Uint8Array(bytes), false);
                    }
                    if (pendingUpdates.length > 0) {
                        await Promise.all(pendingUpdates);
                        pendingUpdates = [];
                    }
                }

            })();
            return () => { };
        }
    }, [worker, fileName]);

    return (
        <div>
            {table && <PerspectiveViewer table={table} restoreConfig={federalDataConfig} />}
        </div>
    )
}