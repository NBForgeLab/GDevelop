# Phase 1 verification

## Native ownership

| Operation | Owner and release point |
| --- | --- |
| Copy a binary serializer snapshot | The disposable snapshot owns its native buffer. The TypeScript caller releases it with `using`. The finalizer handles abandoned snapshot handles when the runtime supports it. |
| Edit a property descriptor | The descriptor owns the vector returned by `getExtraInfo()`. Edit that vector in place. |
| Discover resources on disk | The scanner owns the input path vector. Copy the binder-managed result into a JavaScript array before processing individual resources. |
| Add a newly created resource | The manager clones the resource. The creating operation releases its original wrapper on success and on exceptions. |
| Rename project or installed asset resources | The renamer copies the name map and borrows the project manager. Release the map after constructing the renamer, then release the renamer after traversal. |

A source inventory found 208 direct constructor expressions across 63 native types in tracked editor JavaScript. The most frequent were AbstractFileSystemJS (20), Exporter (19), ExportOptions (16), SerializerElement (15) and InitialInstanceJSFunctor (14). Reproduce the count with the following Git pathspecs. This search omits factories, borrowed getters and TypeScript. A constructor occurrence alone does not establish when ownership transfers to C++.

```sh
git grep -h -o -E 'new gd\.[A-Za-z0-9_]+\(' -- 'newIDE/app/src/**/*.js' ':!*.spec.js' ':!*.test.js' ':!*.stories.js' ':!**/fixtures/**' ':!**/__tests__/**' ':!**/__mocks__/**' ':!**/stories/**'
```

## Editor updates and generated bindings

The scene handler test changes an actual native instance and checks the values received by two preview frames, the serialization count, refreshes of both instance panels, and calls to the root scene refresh. A separate assertion checks the shared property comparison for single and multiple selections. These tests measure calls at the edit handler boundary. Browser frame timings and focus retention during continuous input still require interactive coverage.

The context test counts consumer renders after mounting and updating an unrelated parent. It exercises the router, courses, alerts, guided lessons, private assets, teams and leaderboards. It also checks selected data changes reach consumers. These are seven individual providers, not a mounted full application tree.

The binding generator tests exercise whitespace changes in class and function declarations and rejection of unexpected generator output. Running both patchers on the same freshly generated C++ file yielded identical output for the current IDL.

## Production acceptance

Group `error_message` events by `appVersionWithHash` and `appKind`. Count `guarded-use-after-free` and `error-boundary-error` separately, filtering both on `rawError.errorName == UseAfterFreeError`. The guard counts each observed wrapper once. For each released build and observation window, verify positive editor usage and event ingestion before interpreting zero events. The `program_opening` event aggregates openings in `countSinceLastSent`, so raw event row counts do not measure sessions. Record the observation window, cohort, opening count and both error counts alongside the release. Production acceptance is pending.
