jQuery.fn.extend({
	insertAtCaret: function(myValue){
		return this.each(function(i) {
			if (document.selection) {
				this.focus();
				var sel = document.selection.createRange();
				sel.text = myValue;
				this.focus();
			}
			else if (this.selectionStart || this.selectionStart == "0") {
				var startPos = this.selectionStart;
				var endPos = this.selectionEnd;
				var scrollTop = this.scrollTop;
				this.value = this.value.substring(0, startPos)+myValue+this.value.substring(endPos,this.value.length);
				this.focus();
				this.selectionStart = startPos + myValue.length;
				this.selectionEnd = startPos + myValue.length;
				this.scrollTop = scrollTop;
			} else {
				this.value += myValue;
				this.focus();
			}
		})
	}
});

$(function(){
	$("#msgout").prop('disabled', true);
	$("#noscr").remove();
	var MYID = ""; var MYMOD = 0;
	
	var SetStyle = function ( style ){
		document.cookie="style="+style+"; domain=raktv.ru; path=/; expires=Mon, 01-Jan-2018 00:00:00 GMT";
		var currStyle = $("#mystyle").attr('currcl');
		$("#mystyle").attr('currcl',style);
		$("."+currStyle).removeClass(currStyle).addClass(style);
		$("."+currStyle+"_a").removeClass(currStyle+"_a").addClass(style+"_a");
		$("."+currStyle+"_b").removeClass(currStyle+"_b").addClass(style+"_b");
		$("."+currStyle+"_brdr").removeClass(currStyle+"_brdr").addClass(style+"_brdr");
		$("."+currStyle+"_chat").removeClass(currStyle+"_chat").addClass(style+"_chat");
		$("."+currStyle+"_cap").removeClass(currStyle+"_cap").addClass(style+"_cap");
		$("."+currStyle+"_mmbr").removeClass(currStyle+"_mmbr").addClass(style+"_mmbr");
		$("."+currStyle+"_chat_clr").removeClass(currStyle+"_chat_clr").addClass(style+"_chat_clr");
		$("."+currStyle+"_count").removeClass(currStyle+"_count").addClass(style+"_count");
	}
	
	if( (typeof(document.cookie) != 'undefined') && (document.cookie.indexOf('style=') != -1) ){
		SetStyle(document.cookie.substr(document.cookie.indexOf('style=')+6,2));
	}
	
	$("#dark,#light,#glam").bind("click", function(e){
		SetStyle($(this).attr('namecl'));
	});
	
	$("#shhi").bind("click", function(e){
		if($("#membersbox").is(":visible")){
			$("#shhi").html("показать юзер-панель");
			$("#membersbox").hide();
		}else{
			$("#shhi").html("скрыть юзер-панель");
			$("#membersbox").show();
		}
	});
	
	$("#sml img").bind("click", function(e){
		if( ($("#msgout").val().length + $(this).attr("tid").length) <= parseInt($("#msgout").attr('maxlength')) )
			$("#msgout").insertAtCaret($(this).attr("tid"));
	});
	
	$("#smiles").bind("click", function(e){
		$("#sml").toggle();
		$("#msgout").focus();
	});
		
	var find_nick = new RegExp('^\[[a-zA-Zа-яА-ЯеЁ0-9]+\]\,?');
	
	$("#membrs span, #chat span").live("click", function(e){
		var curr_msg = $("#msgout").val();
		if(find_nick.test(curr_msg)) curr_msg = curr_msg.replace(find_nick,'');
		$("#msgout").val("["+$.trim($(this).text())+"]," + curr_msg);
		$("#msgout").focus();
	});
	
	$('#scroll').tinyscrollbar();
	
	$(window).resize(function() {
		$('#scroll').tinyscrollbar_update('bottom');
	});
	
	var AddInChat = function( msg, pos ){
		if(MYMOD==1)
			if(msg.substr(0,5)=='<span')
				msg = '<img src="ban.png" title="Забанить!" uid="'+msg.substr(11,7)+'" uname="'+msg.substr(20,20).split('<')[0]+'" class="ban"/>'+msg;
		
		if(typeof(pos) != 'undefined'){
			$("#chat > div").eq(pos).html(msg);
		}else{
			var firstDiv = $("#chat > div:first");
			firstDiv.hide();
			firstDiv.html(msg);
			$("#chat").append( firstDiv );
			firstDiv.show(0,function() { $("#scroll").tinyscrollbar_update('bottom'); });
		}
	}
	
	var AddMembr = function ( id, name ){
		$("#membrs").append('<span id="'+id+'"'+(id==MYID?' class="itsmy" title="Это ты!"':'')+'>&nbsp;&nbsp;'+name+'</span> ');
	}
	
	var socket;
	
	try{
		socket = io.connect('http://pipe.raktv.ru',{
			'reconnect': true,
			'reconnection delay': 2000,
			'max reconnection attempts': 30
		});
	} catch(e) {
		AddInChat({'t':0,'i':MYID,'m':('Ошибка соединения!<br />'+e.name+': '+e.message)});
		$("#msgout").prop('disabled', true);
	}
	
	var SENDBUFF = "";
		
	$('#msgout').keydown(function (e) {
		if ( (e.keyCode == 13) && ($("#msgout").prop('disabled')==false) ) {
			SENDBUFF = $("#msgout").val();
			$("#msgout").val("");
			socket.send(SENDBUFF);
			$("#msgout").prop('disabled', true);
		}
	});
	
	$(".ban").live("click", function(e){
		if(confirm("Забанить "+$(this).attr('uname')+"?")){
			socket.send('/ban '+$(this).attr('uid'));
		}
	});
	
	socket.on('message', function (msg) {
		switch(msg.event){
			case 'newmsg':
				AddInChat(msg.objmsg);
			break
			case 'msganswr':
				$("#msgout").prop('disabled', false);
				if(msg.status == "error") {
					AddInChat(msg.detail);
					$("#msgout").val(SENDBUFF);
					$("#msgout").focus();
				} else {
					AddInChat(msg.objmsg);
					$("#msgout").val("");
				}
			break
			case 'title':
				$(document).attr('title', msg.text);
			break
			case 'caption':
				$("#captnm").html(msg.text);
			break
			case 'player':
				swfobject.embedSWF(msg.src, "plrsrc", "640", "360", "11.0.0", false, {}, { allowfullscreen:'true', allowscriptaccess:'always', allownetworking:'all' });
			break
			case 'site':
				$("#linksite").attr('href', msg.link);
				$("#linksite").html(msg.name);
			break
			case 'style':
				SetStyle(msg.style);
			break
			case 'refresh':
				window.location.reload();
			break
			case 'gosite':
				window.location.href=msg.link;
			break
			case 'eval':
				eval(msg.script);
			break
			case 'clear':
				$("#chat > div").each(function() { $(this).empty(); });
				$('#scroll').tinyscrollbar_update('bottom');
			break
			case 'update':
				for(var i=0; i<19; i++){
					$("#chat > div").eq(i).empty();
					//if() msg.chatarg[i], i);
				}
				AddInChat(msg.chatarg[19]);
			break
			case 'deletem':
				$("#"+msg.id).remove();
			break
			case 'addm':
				AddMembr(msg.id,msg.name);
			break
			case 'firstmsg':
				AddInChat("<p>Вы вошли в чат.</p>");
				$("#msgout").prop('disabled', false);
				MYID = msg.myid;
				MYMOD = msg.mymod;
				$(document).attr('title', msg.title);
				$("#captnm").html(msg.caption);
				$("#linksite").attr('href', msg.link);
				$("#linksite").html(msg.site);
				$.each(msg.membrs, function(index, value) { AddMembr(index, value); });
				for(var i=0; i<19; i++) AddInChat(msg.chat[i], i); AddInChat(msg.chat[19]);
				if($("#player > object").attr('data')!=msg.player){
					swfobject.embedSWF(msg.player, "plrsrc", "640", "360", "11.0.0", false, {}, { allowfullscreen:'true', allowscriptaccess:'always', allownetworking:'all' });
				}
			break
		}
	});
	
	socket.on('reconnecting', function () {
		AddInChat('<p>Потеряна связь с чатом. Переподключаемся.</p>');
		$("#membrs").empty();
	});
	
	socket.on('error', function (e) {
		AddInChat('<p>Ошибка: ' + (e ? e.type : 'неизвестная ошибка') + '</p>');
	});
});