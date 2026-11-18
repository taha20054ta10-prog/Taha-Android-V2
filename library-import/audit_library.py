#!/usr/bin/env python3
"""Run the shared library audit and retain the import workflow's artifact name."""
import sys

from catalog import ROOT
from validate_catalog import main


if __name__ == "__main__":
    sys.argv.extend(["--output", str(ROOT / "library-import/all-links-report.json")])
    main()
