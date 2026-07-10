from typing import Literal, TypedDict


CheckStatus = Literal["pass", "warning", "fail"]


class ComplianceCheck(TypedDict):
    label: str
    status: CheckStatus
    detail: str


class PlatformCompliance(TypedDict):
    id: str
    label: str
    status: CheckStatus
    summary: str
    checks: list[ComplianceCheck]


def _check(label: str, passed: bool, detail: str, fail: bool = False) -> ComplianceCheck:
    return {
        "label": label,
        "status": "pass" if passed else ("fail" if fail else "warning"),
        "detail": detail,
    }


def _platform(
    platform_id: str,
    label: str,
    checks: list[ComplianceCheck],
) -> PlatformCompliance:
    statuses = {check["status"] for check in checks}
    status: CheckStatus = "fail" if "fail" in statuses else "warning" if "warning" in statuses else "pass"
    summaries = {
        "pass": "Source image is ready for this platform preset.",
        "warning": "Usable after the recommended Seller Studio fixes.",
        "fail": "Source image needs attention before export.",
    }
    return {
        "id": platform_id,
        "label": label,
        "status": status,
        "summary": summaries[status],
        "checks": checks,
    }


def evaluate_compliance(
    *,
    width: int,
    height: int,
    sharpness: int,
    background_score: int,
    centering_score: int,
    fill_percent: int,
) -> list[PlatformCompliance]:
    shortest = min(width, height)
    longest = max(width, height)
    square_ratio = shortest / longest if longest else 0

    common_quality = [
        _check("Sharpness", sharpness >= 35, f"Sharpness score: {sharpness}/100"),
        _check("Centering", centering_score >= 70, f"Centering score: {centering_score}/100"),
    ]

    return [
        _platform(
            "amazon",
            "Amazon Main",
            [
                _check("Resolution", shortest >= 1000, f"Source: {width} x {height}; 1000px+ recommended for zoom.", fail=True),
                _check("White background", background_score >= 80, f"Background score: {background_score}/100"),
                _check("Product fill", 55 <= fill_percent <= 90, f"Detected fill: {fill_percent}%"),
                *common_quality,
            ],
        ),
        _platform(
            "google_shopping",
            "Google Shopping",
            [
                _check("Resolution", shortest >= 500, f"Source: {width} x {height}; 500px minimum-ready target.", fail=True),
                _check("Product fill", 75 <= fill_percent <= 90, f"Detected fill: {fill_percent}%; 75-90% is recommended."),
                _check("Clean image", background_score >= 70, f"Background score: {background_score}/100"),
                *common_quality,
            ],
        ),
        _platform(
            "daraz",
            "Daraz Product",
            [
                _check("Working resolution", shortest >= 1000, f"Source: {width} x {height}; 1000px+ studio target."),
                _check("Square composition", square_ratio >= 0.92, f"Source ratio readiness: {round(square_ratio * 100)}%"),
                _check("Clean background", background_score >= 75, f"Background score: {background_score}/100"),
                *common_quality,
            ],
        ),
        _platform(
            "tiktok",
            "TikTok Image Ads",
            [
                _check("Resolution", longest >= 720 and shortest >= 628, f"Source: {width} x {height}; suitable for preset conversion.", fail=True),
                _check("Creative sharpness", sharpness >= 35, f"Sharpness score: {sharpness}/100"),
                _check("Safe centering", centering_score >= 65, f"Centering score: {centering_score}/100"),
            ],
        ),
    ]


def recommended_actions(compliance: list[PlatformCompliance]) -> list[str]:
    actions: list[str] = []
    failing_details = [
        check
        for platform in compliance
        for check in platform["checks"]
        if check["status"] != "pass"
    ]

    if any(check["label"] in {"White background", "Clean background", "Clean image"} for check in failing_details):
        actions.append("Turn on background cleanup for clean marketplace outputs.")
    if any(check["label"] in {"Centering", "Safe centering", "Product fill", "Square composition"} for check in failing_details):
        actions.append("Turn on smart centering to normalize product scale and position.")
    if any(check["label"] in {"Resolution", "Working resolution"} and check["status"] == "fail" for check in failing_details):
        actions.append("Use a higher-resolution source image; resizing cannot restore missing detail.")
    if any(check["label"] in {"Sharpness", "Creative sharpness"} for check in failing_details):
        actions.append("Retake or replace blurry source photos before publishing.")

    return list(dict.fromkeys(actions))
