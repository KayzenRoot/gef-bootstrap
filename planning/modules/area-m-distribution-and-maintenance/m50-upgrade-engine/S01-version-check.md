# M50 S01 — Version Check
Status: FROZEN

**VRC50 Version Resolution Capsule** compares installed/candidate semantic versions plus channel, compatibility and provenance. Downgrade, prerelease/channel crossing and unknown provenance require explicit policy. Version discovery may be offline; network checks are bounded/cancellable and never required for normal startup.

Acceptance: SemVer transitions, stale/unknown metadata, channel policy, offline behavior, no silent downgrade.