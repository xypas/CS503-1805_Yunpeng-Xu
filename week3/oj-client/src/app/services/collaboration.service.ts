import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { Subject} from 'rxjs';

declare var io: any;

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
	collaborationSocket: any;
  private _userSource = new Subject<string>();

  constructor() { }

  init(editor: any, sessionId: string): Observable<string>{ 
  	// establish socket connection
  	this.collaborationSocket = io(window.location.origin, { query: 'sessionId=' + sessionId})
  	var userNum: number = 0;

  	//when receive change from the server, apply to local browser session
  	this.collaborationSocket.on('change', (delta: string) => {
  		console.log('collaboration: editor changes ' + delta);
  		delta = JSON.parse(delta);//transfer string to object
  		editor.lastAppliedChange = delta;
  		editor.getSession().getDocument().applyDeltas([delta]); //ace-editor API provides these methods
  		

  	});
    this.collaborationSocket.on('userChange', (userData: string[]) => {
      console.log("collaboration user change: " + userData);
      
      this._userSource.next(userData.toString());
    })
    // this.collaborationSocket.on('numChange', (usernum: number) => {
    //   console.log("collaboration user change: " + usernum);
      
    //   this._userSource.next(usernum.toString());
    // })
    return this._userSource.asObservable();
  }
  // send to server (which will forward to other participants)
  change(delta: string): void {
  	console.log('send message' + delta);
  	this.collaborationSocket.emit('change', delta); 
  }
  // restore buffer from redis cache
  restoreBuffer(): void{
    this.collaborationSocket.emit("restoreBuffer");
  }
 }

