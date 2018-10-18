import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CollaborationService } from '../../services/collaboration.service';
declare var ace: any; // we must declare ace, since the ace is not
//wroten by typescript, use type any.
@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
	editor: any;
	sessionId: string;
	public languages: string[] = ['Java','Python'];
	language: string = 'Java';

	defaultContent = {
		'Java': `public class Solution{
			public static void main(String[] args){
				//Type your Java code here
			}
		}
		`,
		'Python':`class Solution:
		def example():
		#write your python code here 
		`
	}; //use `` to write multi-line text

	constructor(private collaboration: CollaborationService,
		private route: ActivatedRoute) { }

	ngOnInit() {
		this.route.params
		.subscribe(params => {
			this.sessionId = params['id'];
			this.initEditor();
		});
	}
	initEditor(): void{
		// "editor" is the id in html
		this.editor = ace.edit("editor");
		this.editor.setTheme("ace/theme/eclipse");
		this.resetEditor();

		document.getElementsByTagName('textarea')[0].focus();
		//set up collaboration socket

		this.collaboration.init(this.editor, this.sessionId); //sessionId: No. of problem
		this.editor.lastAppliedChange = null; // new has no change
		// register change callback
		this.editor.on('change', (e) => {
			console.log('editor changes: '+ JSON.stringify(e))
			//if the change is initiated from the current browser session
			//then send to the server
			if (this.editor.lastAppliedChange != e){
				this.collaboration.change(JSON.stringify(e)); //avoid forced change 
			}
		}) 
	}
	resetEditor(): void{
		this.editor.getSession().setMode("ace/mode/" + this.language.toLowerCase());
		// set the java
 		this.editor.setValue(this.defaultContent[this.language]);
	}
	setLanguage(language: string): void{
		this.language = language;
		this.resetEditor();
	}

	submit():void{
		let usercode = this.editor.getValue();
		console.log(usercode);
	}
}
