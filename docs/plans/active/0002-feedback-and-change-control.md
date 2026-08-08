# Feedback And Change Control Plan

Last reviewed: 2026-08-08.

Status: Initial process setup in progress.

## Goal

Create a small, traceable process for issues and change requests found during real use, without mixing new feedback into older roadmap or alpha plan history.

## Outcome

Future defects and change requests have a clear intake location, status flow, and promotion path into roadmap entries, active implementation plans, ADRs, release notes, and project state.

## Related Documents

- [../../project/ISSUE_AND_CHANGE_REQUESTS.md](../../project/ISSUE_AND_CHANGE_REQUESTS.md)
- [../../project/PROJECT_STATE.md](../../project/PROJECT_STATE.md)
- [../../product/ROADMAP.md](../../product/ROADMAP.md)
- [README.md](../README.md)

## Tasks

- [x] Add an issue and change request intake log.
- [x] Define issue versus change request terminology.
- [x] Define status flow and ID format.
- [x] Define when feedback updates roadmap, active plans, ADRs, release notes, and project state.
- [x] Require maintainer approval before converting conversation points into issue or change-request intake rows.
- [ ] Use the intake log for the next real-use feedback item.
- [ ] Move this plan to completed after the first feedback item is triaged successfully.

## Acceptance Criteria

- [x] New post-plan feedback can be captured without rewriting original plan scope.
- [x] Conversation-derived feedback is not added to the intake log until the maintainer approves whether it is an issue or change request.
- [x] Accepted feedback has a documented route into execution.
- [x] Deferred or rejected feedback remains visible with a reason.

## Tests

Documentation-only change. No build or test command is required.

## Documentation Updates

Update documentation routing so maintainers and AI agents know where issue and CR feedback belongs.

## Completion Evidence

Initial process documents were added on 2026-08-08.
