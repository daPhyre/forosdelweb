var host='www.forosdelweb.com';
var pathNew='usercp.php';
var pathZero='';

var counter=0;
var newNotif=false;
var protocol='http'
var alwaysNew=false;
var showZero=false;
var deskNoti=null;
var showNoti=true;
var timeNoti=20000;
var timerVar=null;
var timerDelay=300000;
var playSound=true;
var audio=new Audio('sound.ogg'); // sound.ogg is button-44.wav from soundjay.com
window.onload=init;

var BADGE_NEW={color:[0,204,51,255]};
var BADGE_ACTIVE={color:[204,0,51,255]};
var BADGE_LOADING={color:[204,204,51,255]};
var BADGE_INACTIVE={color:[153,153,153,255]};

function loadData(){
	var xhr=new XMLHttpRequest();
	xhr.open('GET','http://www.forosdelweb.com/usercp.php?fdwapi=1',true);
	xhr.onreadystatechange=function(){
		if(xhr.readyState==4){
			chrome.browserAction.setBadgeBackgroundColor(BADGE_INACTIVE);
			
			// Documentación: http://www.forosdelweb.com/3855104-post24.html
			var xmlDoc=new DOMParser().parseFromString(xhr.responseText,'text/xml');
			var userinfo=xmlDoc.getElementsByTagName('userinfo')[0];
			
			if(userinfo){
				var lastCounter=counter;
				counter=0;
				var fdwUser=userinfo.getAttribute('username');
				var fdwValo=0;	//type=1
				var fdwMess=0;	//type=2
				var fdwThem=0;	//type=4
				var fdwSusc=0;	//type=8
				var fdwPriv=parseInt(userinfo.getAttribute('privatemessage'));	//type=16
				var fdwVisi=parseInt(userinfo.getAttribute('visitormessage'));	//type=32
				var fdwInfr=0;	//type=512
				var fdwRequ=parseInt(userinfo.getAttribute('friendrequest'));	//type=1024
				
				var notif=xmlDoc.getElementsByTagName('notification');
				for (var i=0;i<notif.length;i++){
					if(notif[i].getAttribute('highlight')=='true'){
						counter++;
						switch(notif[i].getAttribute('type')){
							case '1':
								fdwValo++;
								break;
							case '2':
								fdwMess++;
								break;
							case '4':
								fdwThem++;
								break;
							case '8':
								fdwSusc++;
								break;
							case '512':
								fdwInfr++;
								break;
						}
					}
				}
				
				var badgeTitle=fdwUser+' - Foros del Web';
				if(fdwValo>0) badgeTitle+='\n> '+fdwValo+' Valoraciones';
				if(fdwMess>0) badgeTitle+='\n> '+fdwMess+' Mensajes';
				if(fdwThem>0) badgeTitle+='\n> '+fdwThem+' Temas';
				if(fdwSusc>0) badgeTitle+='\n> '+fdwSusc+' Suscripciones';
				if(fdwPriv>0) badgeTitle+='\n> '+fdwPriv+' Mensajes Privados';
				if(fdwVisi>0) badgeTitle+='\n> '+fdwVisi+' Mensajes de Visitante';
				if(fdwInfr>0) badgeTitle+='\n> '+fdwInfr+' Infracciones';
				if(fdwRequ>0) badgeTitle+='\n> '+fdwRequ+' Peticiones de Amistad';

				chrome.browserAction.setIcon({path:'icon.png'});
				chrome.browserAction.setTitle({title:badgeTitle});
				if(!showZero&&counter==0)chrome.browserAction.setBadgeText({text:''});
				else chrome.browserAction.setBadgeText({text:counter+''});
				if(counter>lastCounter){
					newNotif=true;
					if(playSound)audio.play();
					if(showNoti){
						if(deskNoti)deskNoti.cancel();
						deskNoti=webkitNotifications.createNotification('icon48.png','Foros del web','Tienes '+counter+' nuevas notificaciones');
						deskNoti.onclick=function(){openPage();this.cancel()};
						deskNoti.show();
						if(timeNoti){window.setTimeout(function(){deskNoti.cancel();},timeNoti);}
					}
				}
				if(newNotif)chrome.browserAction.setBadgeBackgroundColor(BADGE_NEW);
				else if(counter>0)chrome.browserAction.setBadgeBackgroundColor(BADGE_ACTIVE);
			}
			else{
				chrome.browserAction.setIcon({path:'icon-.png'});
				chrome.browserAction.setTitle({title:'Foros del Web\n--Desconectado--'});
				chrome.browserAction.setBadgeText({text:'?'});
				return;
			}
		}
		else return;
	}
	xhr.send(null);
	window.clearTimeout(timerVar);
	timerVar=window.setTimeout(loadData,timerDelay);
}

function init(){
	pathNew=(localStorage.pathNew||localStorage.pathNew=='')?localStorage.pathNew:pathNew;
	pathZero=(localStorage.pathZero||localStorage.pathZero=='')?localStorage.pathZero:pathZero;
	protocol=(localStorage.useHttps=='yes')?'https':'http';
	alwaysNew=(localStorage.alwaysNew)?(localStorage.alwaysNew=='yes'):false;
	showZero=(localStorage.showZero)?(localStorage.showZero=='yes'):false;
	playSound=(localStorage.playSound)?(localStorage.playSound=='yes'):true;
	showNoti=(localStorage.showNoti)?(localStorage.showNoti=='yes'):true;
	timeNoti=parseInt(localStorage.timeNoti||'20000');
	timerDelay=parseInt(localStorage.refreshInterval||'300000');

	chrome.browserAction.setIcon({path:'icon-.png'});
	chrome.browserAction.setBadgeText({text:'...'});
	chrome.browserAction.setBadgeBackgroundColor(BADGE_LOADING);
	loadData();
}

function tabCallback(tab){
	chrome.tabs.onRemoved.addListener(function(tabId){if(tabId==tab.id)loadData();});
	chrome.windows.update(tab.windowId,{focused:true});
}

function openUrl(uri){
	chrome.windows.getAll({populate:true},function(windows){
		if(windows.length<1){
			chrome.windows.create({url:uri,focused:true});
			return;
		}
		else if(!alwaysNew){
			for(var i=0;i<windows.length;i++){
				var tabs=windows[i].tabs;
				for(var j=0;j<tabs.length;j++){
					if(tabs[j].url.indexOf(uri)!=-1){
						//chrome.tabs.update(tabs[j].id,{selected:true},tabCallback); 			// Just Focus
						chrome.tabs.update(tabs[j].id,{url:uri,selected:true},tabCallback); 	// Update and Focus
						return;
					}
				}
			}
		}
		chrome.tabs.getSelected(null,function(tab){
			if(tab.url=='chrome://newtab/')
				chrome.tabs.update(tab.id,{url:uri},tabCallback);
			else
				chrome.tabs.create({url:uri},tabCallback);
		});
	});
}

function openPage(){
	if(counter>0)
		openUrl(protocol+'://'+host+'/'+pathNew);
	else
		openUrl(protocol+'://'+host+'/'+pathZero);
	newNotif=false;
	loadData();
}

chrome.browserAction.onClicked.addListener(function(tab){
	openPage();
});
