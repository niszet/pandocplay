import * as vscode from 'vscode';
import * as child_process from "child_process";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

class NotFoundPandocError extends Error { };
class ExecutionError extends Error { }

export class Pandocplay {
    private outputChannel: vscode.OutputChannel;

    constructor() {
      this.outputChannel = vscode.window.createOutputChannel(
        "pandocplay"
      );
    };

    to_list = ["asciidoc", "asciidoctor", "beamer", "commonmark", "context", 
    "docbook", "docbook4", "docbook5", "docx", "dokuwiki", "dzslides", "epub", "epub2", 
    "epub3", "fb2", "gfm", "haddock", "html", "html4", "html5", "icml", "ipynb", "jats", 
    "jats_archiving", "jats_articleauthoring", "jats_publishing", "jira", "json", "latex", 
    "man", "markdown", "markdown_github", "markdown_mmd", "markdown_phpextra", "markdown_strict", 
    "mediawiki", "ms", "muse", "native", "odt", "opendocument", "opml", "org", "pdf", "plain", 
    "pptx", "revealjs", "rst", "rtf", "s5", "slideous", "slidy", "tei", "texinfo", 
    "textile", "xwiki", "zimwiki"];

    from_list =["commonmark", "creole", "csv", "docbook", "docx", "dokuwiki", "epub", 
    "fb2", "gfm", "haddock", "html", "ipynb", "jats", "jira", "json", "latex", "man", 
    "markdown", "markdown_github", "markdown_mmd", "markdown_phpextra", "markdown_strict", 
    "mediawiki", "muse", "native", "odt", "opml", "org", "rst", "t2t", "textile", "tikiwiki", 
    "twiki", "vimwiki"];

    private getText = (editor: vscode.TextEditor): string => {
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        // Debug purpose.
        vscode.window.showInformationMessage(text);
        return text;
    };
    
    public run2 = () => {
    };

    public run = () => {
        
        if (!vscode.window.activeTextEditor) {
            return;
        }

        try {
            const editor = vscode.window.activeTextEditor;
            const conf = vscode.workspace.getConfiguration("Pandocplay");
            const code = this.getText(editor);
            const cwd = this.getWorkdir(editor);
            const from = this.getFrom(conf);
            const to = this.getTo(conf);
            const ext = this.getExt(conf);
            const args = this.getArgs(conf);
            const path = this.getPath(conf);

            


            //const output_replace = conf.get("output.replace");
            //vscode.window.showInformationMessage(output_replace);

            const output = this.runCode(code, cwd, from, to, ext, args);
            //vscode.window.showInformationMessage(cwd);
        } catch (e) {
            if (e instanceof NotFoundPandocError){
                vscode.window.showErrorMessage("Not found Pandoc.");
            }
        }
    };



private getInputFormatDetect = (conf: vscode.WorkspaceConfiguration): boolean => {
  //TODO: only for CodeBlock.
  const output_replace = conf.get("input.formatDetect");
  if(output_replace){
    return true;
  } else {
    return false;
  }
};

private getOutputReplace = (conf: vscode.WorkspaceConfiguration): boolean => {
  const output_replace = conf.get("output.replace");
  if(output_replace){
    return true;
  } else {
    return false;
  }
};

private getOutputAdd = (conf: vscode.WorkspaceConfiguration): boolean => {
  const output_add = conf.get("output.add");
  if(output_add){
    return true;
  } else {
    return false;
  }
};

private getOutputPane = (conf: vscode.WorkspaceConfiguration): boolean => {
  //TODO: check with --to file type?
  const pane = conf.get("output.pane");
  if(pane){
    return true;
  } else {
    return false;
  }
};

private getOutputFileExt = (conf: vscode.WorkspaceConfiguration, to: string): string => {
  const extension = conf.get("output.file.extension");
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
  const type = conf.get("output.type");
  if(type){
    return true;
  } else {
    return false;
  }
};
  
    private getPath = (conf: vscode.WorkspaceConfiguration): string => {
      const path = conf.get("path");
      if(path){
        // TODO: check file path with string pandoc
        return path as string;
      }
      return "pandoc";
    };

//    private getWorkdir = (conf: vscode.WorkspaceConfiguration): string => {
    private getWorkdir = (editor: vscode.TextEditor): string => {
        const conf = vscode.workspace.getConfiguration("Pandocplay");
        const workdir = conf.get("workdir");
        if (workdir) {
          return workdir as string;
        }
        let fileDir = path.dirname(editor.document.uri.fsPath);
        return fileDir;
      };

      
      private getFrom = (conf: vscode.WorkspaceConfiguration): string => {
//      private getFrom = (editor: vscode.TextEditor): string => {
//        const conf = vscode.workspace.getConfiguration("Pandocplay");
        const from = conf.get("from");
        if (from) {
          return from as string;
        }
        let defaultfrom = "markdown";
        return defaultfrom;
      };

      private getTo = (conf: vscode.WorkspaceConfiguration): string => {
//      private getTo = (editor: vscode.TextEditor): string => {
//        const conf = vscode.workspace.getConfiguration("Pandocplay");
        const to = conf.get("to");
        if (to) {
            let result = this.to_list.find(item => item === to);
            if (!result){
                //TODO: should raise Error here?
                //vscode.window.showInformationMessage(to + "is not in output list.");
            }
          return to as string;
        }
        let defaultTo = "html";
        return defaultTo;
      };

      private getExt = (conf: vscode.WorkspaceConfiguration): string => {
//      private getExt = (editor: vscode.TextEditor): string => {
//        const conf = vscode.workspace.getConfiguration("Pandocplay");
        let ext: string | undefined = conf.get("ext");
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
        const args = conf.get("args");
        if (args) {
          return args as string;
        }
        let defaultArgs = "";
        return defaultArgs;
      };


      private runCode = (code: string, cwd: string, from: string, to: string, ext: string, args: string): string => {
        this.outputChannel.clear();
    
        const codePath = path.join(os.tmpdir(), "text.txt");
        fs.writeFileSync(codePath, code);

        const cmd = "pandoc -f " + from + ext +  " -t " + to + " " + codePath + args;
        // Debug purpose.
        vscode.window.showInformationMessage(cmd);

        // TODO: commandline should be selectable?
        this.outputChannel.appendLine(cmd);
    
        try {
          // TODO: check child_process.
          const buf = child_process.execSync(cmd, { cwd });

          const stdout = buf.toString();
          vscode.window.showInformationMessage(stdout);
          this.outputChannel.append(stdout);
          return stdout;
        } catch (e) {
          this.outputChannel.append(e.stderr.toString());
          this.outputChannel.show();
          throw new ExecutionError();
        }
      };




};
