import * as vscode from 'vscode';
import * as child_process from "child_process";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

class NotFoundPandocError extends Error { };
class ExecutionError extends Error { }
class NotFoundCodeSectonError extends Error {};

export class Pandocplay {
    private outputChannel: vscode.OutputChannel;

    constructor() {
      this.outputChannel = vscode.window.createOutputChannel(
        "pandocplay"
      );
    };
    
    public run_selection = () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }

    try {
      const editor = vscode.window.activeTextEditor;
      const [code, line]  = this.getText(editor);
      this.run(code, line, null);
    } catch (e) {
      if (e instanceof NotFoundPandocError){
          vscode.window.showErrorMessage("Not found Pandoc.");
      }
    }
    };


    public run_codeblock = () => {

      if (!vscode.window.activeTextEditor) {
        return;
      }

    try {
      const editor = vscode.window.activeTextEditor;
      const [code, line, format]  = this.detectSource(editor);
      this.run(code, line, format);
    } catch (e) {
      if (e instanceof NotFoundPandocError){
          vscode.window.showErrorMessage("Not found Pandoc.");
      }
    }

    };
    

    public run = (code: string, line: number, detected_format: string | null) => {
        
        if (!vscode.window.activeTextEditor) {
            return;
        }

        try {
            const editor = vscode.window.activeTextEditor;
            const conf = vscode.workspace.getConfiguration("Pandocplay");
            const cwd = this.getWorkdir(editor);
            const from = this.getFrom(conf);
            const to = this.getTo(conf);
            const ext = this.getExtension(conf);
            const args = this.getArgs(conf);
            const path = this.getPath(conf);

            // format is always detected. this is only for switch
            const fmtdetect = this.getInputFormatDetect(conf);// code block only // override "to"?

            // for binary file output option. TBD.
            const output_file = this.getOutputFile(conf);
            const outfile_ext = this.getOutputFileExt(conf, to);
            const outfile_name = this.getOutputFileName(conf);

            const pane_enable = this.getOutputPane(conf, to);

            // get execution result
            const pandoc_output = this.runCode(code, cwd, from, to, ext, args, path, pane_enable);
            //vscode.window.showInformationMessage(cwd);

            // Replace can be done by delete after adding outputs. So, It should NOT be implemented.
            const output_add = this.getOutputAdd(conf);

            const output_add_format = this.getOutputAddFormat(conf);

            if(output_add){
              let local_to = "";
              if (output_add_format){
                local_to = to;
              }
              this.appendResult(editor, line, pandoc_output, local_to)
            }

            // TBD
            const output_replace = this.getOutputReplace(conf);// selection only


            
        } catch (e) {
            if (e instanceof NotFoundPandocError){
                vscode.window.showErrorMessage("Not found Pandoc.");
            }
        }
    };

    private appendResult = (
      editor: vscode.TextEditor,
      targetLine: number,
      text: string,
      to: string
    ) => {

      let eol: string;
      switch (editor.document.eol) {
        case vscode.EndOfLine.CRLF:
          eol = "\r\n";
        default:
          eol = "\n";
      }
      const outputText = "```" + to + eol + text + eol + "```" + eol;
      editor.edit(edit => {
        edit.insert(new vscode.Position(targetLine, 0), outputText);
      });
    };


    //getTextFromSelection
    private getText = (editor: vscode.TextEditor): [string, number] => {
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      
      //vscode.window.showInformationMessage(text);// Debug purpose.
      const cursorLine = editor.selection.end.line;
      
      //vscode.window.showInformationMessage("Line At " + cursorLine);// Debug purpose.

      return [text, cursorLine + 1];
  };


    /**
     * @param editor text editor
     * @returns codestring, end of code line number 
     */
    private detectSource = (editor: vscode.TextEditor): [string, number, string | null] => {
      // current cursor Line
      const cursorLine = editor.selection.active.line;
  
      let start: vscode.Position | null = null;
      let end: vscode.Position | null = null;
      let format: string | null = null;
  
      vscode.window.showInformationMessage("hello");

      for (let i = cursorLine; i >= 0; i--) {
        const line = editor.document.lineAt(i);
        let pattern = /^\s*```\s*\{?\s*(\w+)?\s*\}?\s*$/;
        //let pattern = /(go)/;
        // if (line.text.startsWith("```go")) {
        // TODO: check
        let mat = pattern.exec(line.text);
        

        //if (pattern.test(line.text)) {
        if (mat) {
          // mat[1] is a found code format.
          if (mat[1]){
            format = mat[1] as string;
          } else{
            format = null;
          }
          vscode.window.showInformationMessage("got: " + mat[1]);

          start = editor.document.lineAt(i + 1).range.start;
          break;
        }
      }
  
      if (!start) {
        throw new NotFoundCodeSectonError();
      }
  
      for (let i = cursorLine; i < editor.document.lineCount; i++) {
        const line = editor.document.lineAt(i);
        if (line.text.startsWith("```")) {
          end = line.range.start;
          break;
        }
      }
  
      if (!end) {
        throw new NotFoundCodeSectonError();
      }
  
      const code = editor.document.getText(new vscode.Range(start, end));
      return [code, end.line + 1, format];
    };


private getInputFormatDetect = (conf: vscode.WorkspaceConfiguration): boolean => {
  //TODO: only for CodeBlock.
  const output_replace = conf.get("input.autoFindFormat");
  if(output_replace){
    return true;
  } else {
    return false;
  }
};

private getOutputReplace = (conf: vscode.WorkspaceConfiguration): boolean => {
  const output_replace = conf.get("output.text.Replace");
  if(output_replace){
    return true;
  } else {
    return false;
  }
};

private getOutputAdd = (conf: vscode.WorkspaceConfiguration): boolean => {
  const output_add = conf.get("output.text.Add");
  if(output_add){
    return true;
  } else {
    return false;
  }
};

private getOutputAddFormat = (conf: vscode.WorkspaceConfiguration): boolean => {
  const output_addFormat = conf.get("output.text.addFormat");
  if(output_addFormat){
    return true;
  } else {
    return false;
  }
};

private getOutputPane = (conf: vscode.WorkspaceConfiguration, to: string): boolean => {
  //TODO: check with --to file type?
  const bin_list =  ["docx", "pdf", "odt", "opendocument", "epub", "epub2", "epub3"];
 
  const pane = conf.get("output.pane");
  let result = bin_list.find(item => item === to);
  if(pane){
    if (result){
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
};

private getOutputFileExt = (conf: vscode.WorkspaceConfiguration, to: string): string => {
  const extension = conf.get("output.file.autoAddExtension");
  if(extension){
    return extension as string;
  } else {
    // use --to format name as an extension.
    return to;
  }
};

private getOutputFileName = (conf: vscode.WorkspaceConfiguration): string => {
  const filename = conf.get("output.file.name");
  if(filename){
    return filename as string;
  } else {
    return "";
  }
};

private getOutputFile = (conf: vscode.WorkspaceConfiguration): boolean => {
  const type = conf.get("output.file.enable");
  if(type){
    return true;
  } else {
    return false;
  }
};
  
    private getPath = (conf: vscode.WorkspaceConfiguration): string => {
      const path:string | undefined = conf.get("Pandoc.path");
      if(path){
        // TODO: check file path with string pandoc
        let mat = path.match("pandoc");
        if (mat) {
          return path as string;
        } else {
          // TODO: throw Error.
          vscode.window.showInformationMessage(path + "seems wrong. pandoc is used instead.");
          return "pandoc";
        }
      }
      return "pandoc";
    };

//    private getWorkdir = (conf: vscode.WorkspaceConfiguration): string => {
    private getWorkdir = (editor: vscode.TextEditor): string => {
        const conf = vscode.workspace.getConfiguration("Pandocplay");
        const workdir = conf.get("Pandoc.workdir");
        if (workdir) {
          return workdir as string;
        }
        let fileDir = path.dirname(editor.document.uri.fsPath);
        return fileDir;
      };

      
      private getFrom = (conf: vscode.WorkspaceConfiguration): string => {
//      private getFrom = (editor: vscode.TextEditor): string => {
//        const conf = vscode.workspace.getConfiguration("Pandocplay");
        const from_list =["commonmark", "creole", "csv", "docbook", "docx", "dokuwiki", "epub", 
        "fb2", "gfm", "haddock", "html", "ipynb", "jats", "jira", "json", "latex", "man", 
        "markdown", "markdown_github", "markdown_mmd", "markdown_phpextra", "markdown_strict", 
        "mediawiki", "muse", "native", "odt", "opml", "org", "rst", "t2t", "textile", "tikiwiki", 
        "twiki", "vimwiki"];

        const from = conf.get("input.from");
        if (from) {
          return from as string;
        }
        let defaultfrom = "markdown";
        return defaultfrom;
      };

      private getTo = (conf: vscode.WorkspaceConfiguration): string => {
//      private getTo = (editor: vscode.TextEditor): string => {
//        const conf = vscode.workspace.getConfiguration("Pandocplay");
        const to_list = ["asciidoc", "asciidoctor", "beamer", "commonmark", "context", 
        "docbook", "docbook4", "docbook5", "docx", "dokuwiki", "dzslides", "epub", "epub2", 
        "epub3", "fb2", "gfm", "haddock", "html", "html4", "html5", "icml", "ipynb", "jats", 
        "jats_archiving", "jats_articleauthoring", "jats_publishing", "jira", "json", "latex", 
        "man", "markdown", "markdown_github", "markdown_mmd", "markdown_phpextra", "markdown_strict", 
        "mediawiki", "ms", "muse", "native", "odt", "opendocument", "opml", "org", "pdf", "plain", 
        "pptx", "revealjs", "rst", "rtf", "s5", "slideous", "slidy", "tei", "texinfo", 
        "textile", "xwiki", "zimwiki"];

        const to = conf.get("output.to");
        if (to) {
            let result = to_list.find(item => item === to);
            if (!result){
                //TODO: should raise Error here?
                //vscode.window.showInformationMessage(to + "is not in output list.");
            }
          return to as string;
        }
        let defaultTo = "html";
        return defaultTo;
      };

      private getExtension = (conf: vscode.WorkspaceConfiguration): string => {
//      private getExt = (editor: vscode.TextEditor): string => {
//        const conf = vscode.workspace.getConfiguration("Pandocplay");
        let ext: string | undefined = conf.get("Pandoc.extension");
        if (ext) {
            if( !ext.startsWith("+")){
                vscode.window.showInformationMessage(ext + " must be started with +. Automatically added");
                ext = "+" + ext;
            }
          return ext as string;
        }
        let defaultExt = "";
        return defaultExt;
      };

      private getArgs = (conf: vscode.WorkspaceConfiguration): string => {
//      private getArgs = (editor: vscode.TextEditor): string => {
//        const conf = vscode.workspace.getConfiguration("Pandocplay");
        const args = conf.get("Pandoc.args");
        if (args) {
          return args as string;
        }
        let defaultArgs = "";
        return defaultArgs;
      };


      private runCode = (code: string, cwd: string, from: string, to: string, ext: string, 
        args: string, pandocpath: string, pane: boolean): string => {
        
        
          this.outputChannel.clear();
        
          const codePath = path.join(os.tmpdir(), "runpandoctmp.txt");
        fs.writeFileSync(codePath, code);

        // TODO: add -o option and its related.
        // const cmd = "pandoc -f " + from + ext +  " -t " + to + " " + codePath + args;
        const cmd = pandocpath + " -f " + from + ext +  " -t " + to + " " + codePath + args;

        // vscode.window.showInformationMessage(cmd);// Debug purpose.

        try {
          // TODO: check child_process.
          const buf = child_process.execSync(cmd, { cwd });

          const stdout = buf.toString();
          //vscode.window.showInformationMessage(stdout);//Debug porpose

          // OUTPUT pane
          if (pane) {
            this.outputChannel.appendLine(cmd);
            this.outputChannel.append(stdout);
          } else{
            vscode.window.showInformationMessage("Not Shown in OUTPUT Pane. This message is debugg purpose.");
          }

          // Remove temp file after execution.
          fs.unlinkSync(codePath);

          return stdout;
        } catch (e) {
          this.outputChannel.append(e.stderr.toString());
          this.outputChannel.show();
          throw new ExecutionError();
        }
      };




};
