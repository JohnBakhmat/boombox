import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Duration, Effect, Layer, Stream } from "effect";
import { DatabaseLive } from "../db";
import { readDirectory } from "../file-parser";
import { Env, EnvLive } from "~/utils/env";
import { OtelLive } from "~/utils/otel";
import { FlacService } from "~/flac/service";

// Helpers
function formatBytes(bytes: number): string {
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function printMemorySnapshot(timestamp: number, heapUsed: number, heapMax: number) {
	const maxWidth = 100;

	const bar = "=".repeat((heapUsed / heapMax) * maxWidth);

	return `${bar} ${timestamp}ms: ${formatBytes(heapUsed)}\n`;
}

function printMemorySnapshots(
	iteration: number,
	memorySnapshots: Array<{ timestamp: number; rss: number; heapUsed: number }>,
) {
	return Effect.gen(function* () {
		yield* Console.log(`=== MEMORY SNAPSHOTS BY ITERATION ${iteration} ===`);

		const fileName = `./benchmark-stream/mem-snapshots-${iteration}-${Date.now()}.txt`;

		const file = Bun.file(fileName);
		const writer = file.writer();

		const maxHeap = memorySnapshots.reduce((acc, cur) => Math.max(acc, cur.heapUsed), 0);

		for (const snapshot of memorySnapshots) {
			const line = printMemorySnapshot(snapshot.timestamp, snapshot.heapUsed, maxHeap);
			writer.write(line);
		}
		yield* Console.log("==========================");
	});
}

// ##

const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive.Default, FlacService.Default);

const iteration = (i: number) =>
	Effect.gen(function* () {
		const env = yield* Env.pipe(Effect.flatMap((x) => x.getEnv)).pipe(Effect.withSpan("env"));

		const results = {
			elapsed: 0,
			files: 0,
		};

		const memorySnapshots: Array<{ timestamp: number; rss: number; heapUsed: number }> = [];
		let peakMemory = 0;
		const startMem = process.memoryUsage();
		const startTime = Date.now();

		const interval = setInterval(() => {
			const mem = process.memoryUsage();
			const elapsed = Date.now() - startTime;

			memorySnapshots.push({
				timestamp: elapsed,
				rss: mem.rss,
				heapUsed: mem.heapUsed,
			});

			peakMemory = Math.max(peakMemory, mem.heapUsed);
		}, 50);

		const task = readDirectory(env.FOLDER_PATH, []).pipe(Effect.flatMap((stream) => Stream.runCollect(stream)));

		yield* task.pipe(
			Effect.timed,
			Effect.tap(([duration, result]) =>
				Console.log(`Iteration ${i} took ${Duration.toMillis(duration)}ms and found ${result.length} files`),
			),
			Effect.tap(([duration, result]) => {
				results.elapsed += Duration.toMillis(duration);
				results.files += result.length;
			}),
			Effect.map(([_, result]) => result),
		);

		clearInterval(interval);
		const endMem = process.memoryUsage();

		return {
			...results,
			startTime,
			endTime: Date.now(),
			peakMemory,
			memorySnapshots,
			startMem,
			endMem,
		};
	});

type IterationResult = Effect.Effect.Success<ReturnType<typeof iteration>>;

const benchmark = Effect.gen(function* () {
	const results: Array<IterationResult> = [];
	for (let i = 0; i < 10; i++) {
		const iterationResults = yield* iteration(i);
		results.push(iterationResults);
	}

	yield* Console.dir(results);
	yield* Effect.tryPromise(() => Bun.write("./benchmark-stream/results.json", JSON.stringify(results, null, 2)));

	const avgTime = results.reduce((acc, cur) => acc + cur.elapsed, 0) / results.length;
	const avgPeak = results.reduce((acc, cur) => acc + cur.peakMemory, 0) / results.length;
	const avgFiles = results.reduce((acc, cur) => acc + cur.files, 0) / results.length;
	const maxFiles = results.reduce((acc, cur) => Math.max(acc, cur.files), 0);
	const fileErrorRate = avgFiles / maxFiles;

	const avgHeapDelta =
		results.reduce((acc, cur) => acc + cur.endMem.heapUsed - cur.startMem.heapUsed, 0) / results.length;

	const template = `
    === BENCHMARK RESULTS ===
    Average time: ${avgTime}ms
    Files found: ${maxFiles} error rate ${fileErrorRate}
    Average peak memory: ${formatBytes(avgPeak)}
    Average heap delta: ${formatBytes(avgHeapDelta)}
    =========================
    `;

	yield* Console.log(template);

	for (const [i, result] of results.entries()) {
		yield* printMemorySnapshots(i, result.memorySnapshots);
	}
}).pipe(Effect.provide(OtelLive), Effect.provide(layers));

// @ts-expect-error - BunRuntime.runMain is not typed
BunRuntime.runMain(benchmark);
