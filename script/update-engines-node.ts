/* eslint no-console: off */

import fs from 'fs';
import path from 'path';
import recursive from 'recursive-readdir';
import semver from 'semver';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

function isObject(value: unknown): value is { [index: string]: unknown } {
    return typeof value === 'object' && value !== null;
}

interface PkgDataInterface {
    engines: {
        node: string;
    };
}

function isPkgData(value: unknown): value is PkgDataInterface {
    if (isObject(value)) {
        const engines = value.engines;
        return isObject(engines) && typeof engines.node === 'string';
    }
    return false;
}

function setEngines<T>(value: T, nodeSemVer: string): PkgDataInterface | void {
    if (!isObject(value)) {
        return;
    }
    if (isObject(value.engines)) {
        value.engines.node = nodeSemVer;
    } else {
        Object.assign(value, {
            engines: {
                node: nodeSemVer,
            },
        });
    }
    return isPkgData(value) ? value : undefined;
}

function rangeArray(length: number): number[] {
    return [...Array(length + 1).keys()];
}

function uniqueArray<T>(array: T[]): T[] {
    return [...new Set(array)];
}

async function readJSONFile(filepath: string): Promise<unknown | void> {
    const dataText = await readFileAsync(filepath, 'utf8');
    try {
        return JSON.parse(dataText);
    } catch (error) {
        console.error(`JSON parse error: ${filepath}`);
    }
    return undefined;
}

async function writeJSONFile(filepath: string, data: unknown): Promise<void> {
    await writeFileAsync(filepath, JSON.stringify(data, null, 2));
}

function getVersion(
    rangeList: string[],
    versions: string[],
    xxxSatisfying: typeof semver.minSatisfying | typeof semver.maxSatisfying,
    comparisonFunc: typeof semver.gt | typeof semver.lt,
): string | null {
    return rangeList
        .map(range => xxxSatisfying(versions, range))
        .reduce((a, b) => (a && b ? (comparisonFunc(a, b) ? a : b) : null));
}

function getMinMaxVersion(
    rangeList: string[],
    versions: string[],
): { min: string | null; max: string | null } {
    return {
        min: getVersion(rangeList, versions, semver.minSatisfying, semver.gt),
        max: getVersion(rangeList, versions, semver.maxSatisfying, semver.lt),
    };
}

(async () => {
    const projectPkgPath = path.join(process.cwd(), 'package.json');
    const projectPkgData = await readJSONFile(projectPkgPath);
    if (!isObject(projectPkgData)) {
        return;
    }
    const currentNodeRange = isPkgData(projectPkgData)
        ? projectPkgData.engines.node
        : null;

    const files = await recursive(path.join(process.cwd(), 'node_modules'));
    const pkgFiles = files.filter(
        filepath => path.basename(filepath) === 'package.json',
    );
    const pkgDatas = await Promise.all(pkgFiles.map(readJSONFile));
    const rangeList = uniqueArray(
        pkgDatas.filter(isPkgData).map(data => data.engines.node),
    );
    const maxNumber = rangeList
        .map(range => range.match(/[0-9]+/g))
        .reduce((a, b) => Math.max(a, ...(b || []).map(Number)), -Infinity);
    const maxRangeNumber = maxNumber + 1;
    const maxNumberRegExp = new RegExp(
        String.raw`(?<=^|\.)${maxRangeNumber}(?=\.|$)`,
        'g',
    );

    const rangePearList: { min: string; max: string }[] = [];
    for (const major of rangeArray(maxRangeNumber).reverse()) {
        for (const minor of rangeArray(maxRangeNumber).reverse()) {
            const versions = rangeArray(maxRangeNumber).map(
                patch => `${major}.${minor}.${patch}`,
            );
            const { min, max } = getMinMaxVersion(rangeList, versions);

            if (min && max) {
                const nextVersionList = [
                    semver.inc(max, 'minor'),
                    semver.inc(max, 'major'),
                ];
                const nextVersionIndex = rangePearList.findIndex(({ min }) =>
                    nextVersionList.includes(min),
                );
                if (nextVersionIndex >= 0) {
                    rangePearList[nextVersionIndex].min = min;
                } else {
                    rangePearList.push({ min, max });
                }
            }
        }
    }

    const newNodeRange = semver.validRange(
        rangePearList
            .reverse()
            .map(({ min, max }) => ({
                min: min.replace(maxNumberRegExp, 'x'),
                max: max.replace(maxNumberRegExp, 'x'),
            }))
            .map(({ min, max }) => `${min} - ${max}`)
            .join(' || '),
    );

    if (currentNodeRange === newNodeRange) {
        return;
    }

    const updatedProjectPkgData = setEngines(projectPkgData, newNodeRange);
    writeJSONFile(projectPkgPath, updatedProjectPkgData);
})();
