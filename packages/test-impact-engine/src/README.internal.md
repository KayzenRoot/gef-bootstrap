# M28 semantic boundary

This directory contains deterministic provider-neutral semantics only. It must not access filesystem, network, Git, CI, process execution, clocks, checkpoint/progress mutation, release mutation, or validation scheduling. Adjacent owners consume immutable receipts/handoffs through `public.ts`.
