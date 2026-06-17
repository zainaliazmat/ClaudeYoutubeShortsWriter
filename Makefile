# Fathom factory — convenience targets. See SETUP.md.
.PHONY: doctor bootstrap render render-f001 clean-public help

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
	@bash scripts/render-run.sh output/F-001-cleopatra-vs-pyramids

render:
	@bash scripts/render-run.sh $(RUN)

clean-public:
	@find render/public -maxdepth 1 -type f ! -name '.gitkeep' -delete && echo "render/public cleaned"
