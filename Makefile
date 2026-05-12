.PHONY: help smoke

help:
	@echo "Targets:"
	@echo "  make smoke  - HTTP smoke (needs backend; set SQLAGENT_BASE_URL if not http://127.0.0.1:8000)"

smoke:
	python3 scripts/e2e_http_smoke.py
