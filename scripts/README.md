# Scripts files for GDevelop

-   **ReleaseProcedure.bat**: this script compiles, generates documentation (see **GenerateAllDocs.bat**) and packages GDevelop for Windows in an installer and an archive.
-   **ReleaseProcedure.sh**: compiles and packages GD for Ubuntu (see _Binaries/Packaging_).
-   **CopyWindowsToLinuxReleaseFiles.sh**: Copies all files in _Binaries/Output/Release_Windows_ to _Binaries/Output/Release_Linux_. Call it after any change in _Binaries/Output/Release_Windows_.
-   **GenerateAllDocs.[bat|sh]**: Calls doxygen to generate all documentation into _docs_ folder.
-   **ExtractTranslations.[bat|sh]**: Creates the _source.pot_ file containing the strings to be translated using [Crowdin](https://crowdin.com/project/gdevelop). Requires `gettext` (`xgettext`) to be available on your system `PATH` (on Windows, install `gettext` via `winget`, `scoop`, `choco`, or Poedit, as bundled Windows `xgettext.exe`/DLL binaries are not included in the repository).
