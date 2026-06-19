# Fathom factory — convenience targets. See SETUP.md.
.PHONY: doctor bootstrap render render-f001 clean-public check-lottie help

help:
	@echo "make bootstrap   - set up .venv-tts + render/node_modules + seed F-001 public"
	@echo "make doctor      - assert all prerequisites are present"
	@echo "make render-f001 - render + master the F-001 baseline to output/F-001.../final.mp4"
	@echo "make render RUN=output/F-NNN-slug - render + master any run folder"

doctor:
	@bash scripts/doctor.sh

bootstrap:
	@bash scripts/bootstrap.sh

render-f001:
	@node scripts/render-run.mjs output/F-001-cleopatra-vs-pyramids

render:
	@node scripts/render-run.mjs $(RUN)

clean-public:
	@find render/public -maxdepth 1 -type f ! -name '.gitkeep' -delete && echo "render/public cleaned"

# Slow-lane Lottie accent checks (bundle + render; not in the fast gate).
# Run before landing accent changes and on the proof-of-life render.
check-lottie:
	cd render && npm run gate && npm run test:lib && npm run check:determinism:lottie && npm run check:determinism:lottie-src && npm run check:render:lottie
