// Deterministic Lottie accent: @remotion/lottie (lottie-web, goToAndStop) only —
// never the dotLottie/ThorVG autoplay runtime. animationData identity is stabilized
// via a module-level cache so Remotion never re-initializes mid-render.
import React, { useEffect, useMemo, useState } from "react";
import { Lottie, getLottieMetadata, type LottieAnimationData } from "@remotion/lottie";
import { cancelRender, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import { assertAccentFps, accentBoxStyle, loopForWindow, type AccentPlacement } from "./lottie-helpers";

export type LottieAccentProps = {
	/** Path under public/ (run-scoped, seeded by seed-public.sh). Mutually exclusive with animationData. */
	src?: string;
	/** In-memory animation (e.g. an imported .json fixture). Mutually exclusive with src. */
	animationData?: LottieAnimationData;
	placement: AccentPlacement;
	/** Frames the accent occupies; drives the loop decision. */
	windowFrames: number;
	renderer?: "svg" | "canvas";
};

const animationCache = new Map<string, LottieAnimationData>();

export const LottieAccent: React.FC<LottieAccentProps> = ({
	src,
	animationData,
	placement,
	windowFrames,
	renderer = "svg",
}) => {
	if ((src == null) === (animationData == null)) {
		throw new Error("[LottieAccent] provide exactly one of `src` or `animationData`.");
	}
	const { fps } = useVideoConfig();

	// Direct (fixture) path: identity is the imported module — already stable.
	const [fetched, setFetched] = useState<LottieAnimationData | null>(
		() => (src ? (animationCache.get(src) ?? null) : null),
	);
	const [handle] = useState(() =>
		src && !animationCache.has(src)
			? delayRender(`Lottie ${src}`, { retries: 2, timeoutInMilliseconds: 30000 })
			: null,
	);

	useEffect(() => {
		if (handle === null || !src) return; // cache hit or direct path: nothing to load
		let cancelled = false;
		fetch(staticFile(src))
			.then((r) => r.json())
			.then((json: LottieAnimationData) => {
				animationCache.set(src, json);
				if (!cancelled) setFetched(json);
				continueRender(handle);
			})
			.catch((err) => cancelRender(err));
		return () => {
			cancelled = true;
		};
	}, [src, handle]);

	const data = animationData ?? fetched;
	// Hard-fail fps guard + loop decision are pure functions of the (stable) data.
	const decision = useMemo(() => {
		if (!data) return null;
		const meta = getLottieMetadata(data);
		assertAccentFps(meta?.fps, fps, src ?? "animationData"); // throws on mismatch — do NOT catch
		return { loop: loopForWindow(meta!.durationInFrames, windowFrames) };
	}, [data, fps, windowFrames, src]);

	if (!data || !decision) return null;

	return (
		<Lottie
			animationData={data}
			loop={decision.loop}
			renderer={renderer}
			preserveAspectRatio="xMidYMid meet"
			style={accentBoxStyle(placement)}
		/>
	);
};
