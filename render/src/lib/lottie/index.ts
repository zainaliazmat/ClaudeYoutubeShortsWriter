// lib/lottie — the Lottie accent-layer primitive. @remotion/lottie (lottie-web,
// goToAndStop) only; never the dotLottie/ThorVG autoplay runtime. Accents are 30fps
// .json, generate-first via the lottie-master skill. Peer to Background/Captions.
export { LottieAccent, type LottieAccentProps } from "./LottieAccent";
export {
	CANONICAL_FPS,
	assertAccentFps,
	accentBoxStyle,
	loopForWindow,
	type AccentPlacement,
} from "./lottie-helpers";
