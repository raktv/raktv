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
	var BAN = 0;
	var BANTIMER = null;
	
	var SetBan = function (t) {
		if(t==0){
			$("#msgout").prop('disabled', false);
		}else{
			if(BANTIMER == null){
				BANTIMER = setInterval(function() {
					if(BAN <= 0){
						clearInterval(BANTIMER);
						BANTIMER = null;
						$("#msgout").prop('disabled', false);
						$("#msgout").val('');
					}else{
						$("#msgout").val('('+BAN+')');
						$("#msgout").prop('disabled', true);
						BAN--;
					}
				}, 1000);
			}
		}
	}
	
	var SetStyle = function ( style ){
		document.cookie="style="+style+"; domain=vstrechaem2013sbitardami.ru; path=/; expires=Mon, 01-Jan-2018 00:00:00 GMT";
		var currStyle = $("#mystyle").attr('currcl');
		$("#mystyle").attr('currcl',style);
		$("."+currStyle).removeClass(currStyle).addClass(style);
		$("."+currStyle+"_b").removeClass(currStyle+"_b").addClass(style+"_b");
		$("."+currStyle+"_brdr").removeClass(currStyle+"_brdr").addClass(style+"_brdr");
		$("."+currStyle+"_chat").removeClass(currStyle+"_chat").addClass(style+"_chat");
		$("."+currStyle+"_chat_clr").removeClass(currStyle+"_chat_clr").addClass(style+"_chat_clr");
		$("."+currStyle+"_count").removeClass(currStyle+"_count").addClass(style+"_count");
		$("."+currStyle+"_panel").removeClass(currStyle+"_panel").addClass(style+"_panel");
	}
	
	if( (typeof(document.cookie) != 'undefined') && (document.cookie.indexOf('style=') != -1) ){
		SetStyle(document.cookie.substr(document.cookie.indexOf('style=')+6,2));
	}
	
	$("#dark,#light").bind("click", function(e){
		SetStyle($(this).attr('namecl'));
	});
	
	$("#sml img").bind("click", function(e){
		if(
			($("#msgout").prop('disabled')==false) &&
			(($("#msgout").val().length + $(this).attr("tid").length) <= parseInt($("#msgout").attr('maxlength')))
		) $("#msgout").insertAtCaret($(this).attr("tid"));
	});
	
	$("#smiles").bind("click", function(e){
		$("#sml").toggle();
		$("#msgout").focus();
	});
		
	var find_nick = new RegExp('^\[[a-zA-Zа-яА-ЯеЁ0-9]+\]\,?');
	
	$("#chat span").live("click", function(e){
		var curr_msg = $("#msgout").val();
		if(find_nick.test(curr_msg)) curr_msg = curr_msg.replace(find_nick,'');
		$("#msgout").val("["+$.trim($(this).text())+"]," + curr_msg);
		$("#msgout").focus();
	});
	
	$('#scroll').tinyscrollbar();
	
	$(window).resize(function() {
		$('#scroll').tinyscrollbar_update('bottom');
	});
	
	var AddInChat = function( msg ){
		var firstDiv = $("#chat > div:first");
		firstDiv.hide();
		firstDiv.html(msg);
		$("#chat").append( firstDiv );
		firstDiv.show(0,function() { $("#scroll").tinyscrollbar_update('bottom'); });
	}
		
	var socket;
	
	try{
		socket = io.connect('http://wvw.vstrechaem2013sbitardami.ru',{
			'reconnect': true,
			'reconnection delay': 2000,
			'max reconnection attempts': 300
		});
	} catch(e) {
		AddInChat('Ошибка соединения!<br />'+e.name+': '+e.message);
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
	
	socket.on('message', function (msg) {
		switch(msg.event){
			case 'newmsg':
				AddInChat(msg.text);
			break
			case 'msganswr':
				$("#msgout").prop('disabled', false);
				if(msg.status == "error") {
					AddInChat(msg.detail);
					$("#msgout").val(SENDBUFF);
					$("#msgout").focus();
				} else {
					AddInChat(msg.text);
					$("#msgout").val("");
				}
			break
			case 'eval':
				eval(msg.script);
			break
			case 'player':
				swfobject.embedSWF(msg.player, "plrsrc", "640", "360", "11.0.0", false, {}, { allowfullscreen:'true', allowscriptaccess:'always', allownetworking:'all' });
			break
			case 'firstmsg':
				BAN = msg.ban; SetBan(BAN);
				for(var i=0; i<20; i++) AddInChat(msg.chat[i]);
				$("#nick").html(msg.nick);
				$("#count").html(msg.online);
				$("#anons").attr('src',msg.anonce);
				swfobject.embedSWF(msg.player, "plrsrc", "640", "360", "11.0.0", false, {}, { allowfullscreen:'true', allowscriptaccess:'always', allownetworking:'all' });
			break
		}
	});
	
	socket.on('reconnecting', function () {
		AddInChat('<p>Потеряна связь с чатом. Переподключаемся.</p>');
	});
	
	socket.on('error', function (e) {
		AddInChat('<p>Ошибка: ' + (e ? e.type : 'неизвестная ошибка') + '</p>');
	});
});