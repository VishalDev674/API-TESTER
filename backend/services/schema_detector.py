"""
Shadow API Tester — Schema Detector
Detects API response schema changes and auto-updates expectations.
"""
import json
from typing import Dict, Any, Optional, List, Tuple
from services.ai_engine import ai_engine
from services.websocket_manager import ws_manager


class SchemaDetector:
    """Detects and auto-fixes API response schema changes."""

    def compare_schemas(self, expected: Dict, actual: Any) -> Tuple[bool, List[Dict]]:
        """
        Compare expected schema against actual response.
        Returns (matches, differences).
        """
        if expected is None:
            return True, []

        differences = []
        self._deep_compare(expected, actual, "", differences)
        return len(differences) == 0, differences

    def _deep_compare(self, expected: Any, actual: Any, path: str, diffs: List[Dict]):
        """Recursively compare two structures."""
        if isinstance(expected, dict) and isinstance(actual, dict):
            expected_keys = set(expected.keys())
            actual_keys = set(actual.keys())

            # Missing keys
            for key in expected_keys - actual_keys:
                diffs.append({
                    "path": f"{path}.{key}" if path else key,
                    "type": "missing_field",
                    "expected": key,
                    "actual": None,
                })

            # Extra keys
            for key in actual_keys - expected_keys:
                diffs.append({
                    "path": f"{path}.{key}" if path else key,
                    "type": "extra_field",
                    "expected": None,
                    "actual": key,
                })

            # Recurse on common keys
            for key in expected_keys & actual_keys:
                self._deep_compare(
                    expected[key], actual[key],
                    f"{path}.{key}" if path else key, diffs
                )

        elif isinstance(expected, list) and isinstance(actual, list):
            if expected and actual:
                self._deep_compare(expected[0], actual[0], f"{path}[0]", diffs)
            elif expected and not actual:
                diffs.append({
                    "path": path,
                    "type": "empty_array",
                    "expected": "non-empty",
                    "actual": "empty",
                })

        elif type(expected) != type(actual) and expected is not None and actual is not None:
            diffs.append({
                "path": path,
                "type": "type_mismatch",
                "expected": type(expected).__name__,
                "actual": type(actual).__name__,
            })

    def generate_schema_from_response(self, response: Any) -> Dict:
        """Generate a schema expectation from an actual API response."""
        if isinstance(response, dict):
            return {k: self.generate_schema_from_response(v) for k, v in response.items()}
        elif isinstance(response, list):
            if response:
                return [self.generate_schema_from_response(response[0])]
            return []
        elif isinstance(response, str):
            return "string"
        elif isinstance(response, bool):
            return "boolean"
        elif isinstance(response, int):
            return "integer"
        elif isinstance(response, float):
            return "float"
        elif response is None:
            return "null"
        return "unknown"

    async def detect_and_heal(
        self,
        endpoint_name: str,
        expected_schema: Optional[Dict],
        actual_response: Any,
    ) -> Optional[Dict]:
        """
        Detect schema mismatch and use AI to generate updated schema.
        Returns new schema if auto-fix applied, None if no change needed.
        """
        if expected_schema is None:
            return None

        matches, differences = self.compare_schemas(expected_schema, actual_response)
        if matches:
            return None

        await ws_manager.broadcast("ai_thoughts", {
            "message": f"Schema mismatch detected for [{endpoint_name}]: {len(differences)} differences found",
            "level": "warning",
        })

        # Use AI to analyze the schema change
        analysis = await ai_engine.analyze_schema_change(
            endpoint_name, expected_schema, actual_response
        )

        if analysis.get("auto_fix_safe", False):
            new_schema = analysis.get("new_schema", actual_response)
            await ws_manager.broadcast("ai_thoughts", {
                "message": f"Auto-fixing schema for [{endpoint_name}]... applying new expectation",
                "level": "heal",
            })
            return new_schema

        await ws_manager.broadcast("ai_thoughts", {
            "message": f"Schema change for [{endpoint_name}] flagged as breaking. Manual review recommended.",
            "level": "error",
        })
        return None


# Singleton
schema_detector = SchemaDetector()
