# pandocplay README

This extension is for running Pandoc with selected lines or code block in the document. User can use it with several package options. Please see OPTIONS in detail.

## Features

This package enables you to run Pandoc with selected text range and code block. 

### Usage

You can use 2 ways of running Pandoc. When you select range of texts, you can use "Run Pandoc Selection Range" by right click. If you put the cursor in code block,  "Run Pandoc Code Block" can be used by right click. Of corse you can use these commands from command.

## Requirements

You must install Pandoc executable. If you can run Pandoc as `pandoc` in command line, you can use this without setting. If you want to set path to specific Pandoc, set "Pandoc.Path" in option pane.

## Extension Settings

Following options are implemented preliminary.

- `Pandoc.path`
- `Pandoc.args`
- `Pandoc.extension`
- `Pandoc.workdir`
- `input.from`
- `output.to`
- `output.text.Add`
- `output.pane`

### Pandoc.path

You can specify path to Pandoc executable. Default is "pandoc".

### Pandoc.args

You can add arguments for Pandoc. See [Options](https://pandoc.org/MANUAL.html#options) section in the manual of Pandoc for detail.

### Pandoc.extension

You can add extensions for Pandoc. See [Extensions](https://pandoc.org/MANUAL.html#extensions) section in the manual of Pandoc for detail.

### Pandoc.workdir

Running directory of pandoc. Default is current directory. Selected text range or code block is written to temp file when you exec pandoc. This temp file location and its filename cannot be changed.

### input.from

You can set input file format (This value is used with `--from` option.). To know available file format, see [General options](https://pandoc.org/MANUAL.html#general-options) section in the manual of Pandoc for detail.


### `output.to`

You can set output file format (This value is used with `--to` option.). To know available file format, see [General options](https://pandoc.org/MANUAL.html#general-options) section in the manual of Pandoc for detail.

### output.text.Add

You can add output result at the next line of mouse cursor or after code block.

### output.pane

You can select to output to OUTPUT pane or not.

## Known Issues

* Several functions are not implemented yet.
* No test included.
* Only checked under Windows. Not in mac or linux yet.

## Contribution

If you have any issues, please use issue of this repository.

## Release Notes

### 0.0.1

Initial release of pandocplay. This is preliminary and it still under developing.

-----------------------------------------------------------------------------------------------------------

## Acknowledgement

This extension is based on the book [Visual Studio Code実践ガイド —最新コードエディタを使い倒すテクニック](https://gihyo.jp/book/2020/978-4-297-11201-1) and its sample codes. 

