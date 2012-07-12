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
	var GLBLSND=false;
	var STYLES = [
		{ 'class':'lc', 'name':'светлый'},
		{ 'class':'dc', 'name':'темный' },
		{ 'class':'gc', 'name':'гламур' }
	];
	
	$("#chat").scrollTop(10000000);
	
	var SetStyle = function ( id ){
		document.cookie="style="+id+"; domain=raktv.ru; path=/; expires=Mon, 01-Jan-2018 00:00:00 GMT";
		var currStyle = STYLES[parseInt($("#chst").attr('slasid'))].class;
		var newStyle = STYLES[id].class;
		$("."+currStyle).removeClass(currStyle).addClass(newStyle);
		$("."+currStyle+"_a").removeClass(currStyle+"_a").addClass(newStyle+"_a");
		$("."+currStyle+"_b").removeClass(currStyle+"_b").addClass(newStyle+"_b");
		$("."+currStyle+"_brdr").removeClass(currStyle+"_brdr").addClass(newStyle+"_brdr");
		$("."+currStyle+"_chat").removeClass(currStyle+"_chat").addClass(newStyle+"_chat");
		$("."+currStyle+"_cap").removeClass(currStyle+"_cap").addClass(newStyle+"_cap");
		$("."+currStyle+"_mmbr").removeClass(currStyle+"_mmbr").addClass(newStyle+"_mmbr");
		$("."+currStyle+"_chat_clr").removeClass(currStyle+"_chat_clr").addClass(newStyle+"_chat_clr");
		$("."+currStyle+"_btn").removeClass(currStyle+"_btn").addClass(newStyle+"_btn");
		$("."+currStyle+"_msgout").removeClass(currStyle+"_msgout").addClass(newStyle+"_msgout");
		$("#chst").html(STYLES[id].name);
		$("#chst").attr('slasid',id);
	}
	
	if( (typeof(document.cookie) != 'undefined') && (document.cookie.indexOf('style=') != -1) ){
		SetStyle(parseInt(document.cookie.substr(document.cookie.indexOf('style=')+6,1)));
	}
	
	$("#chst").bind("click", function(e){
		var currStyleID = parseInt($(this).attr('slasid'));
		
		if( typeof(STYLES[currStyleID+1]) == 'undefined'){
			SetStyle(0);
		}else{
			SetStyle(currStyleID+1);
		}
	});
				
				var CropMaxLen = function(){
					var max = parseInt($("#msgout").attr('maxlength'));
					if($("#msgout").val().length > max)
						$("#msgout").val($("#msgout").val().substr(0, $("#msgout").attr('maxlength')));
				};
				
				$("#shhi").bind("click", function(e){
					if($("#memberpost").is(":visible")){
						$("#shhi").html("показать юзер-панель");
						$("#memberpost").hide();
					}else{
						$("#shhi").html("скрыть юзер-панель");
						$("#memberpost").show();
					}
					$("#chat").scrollTop(10000000);
				});
				
				$("#sml img").bind("click", function(e){
					$("#msgout").insertAtCaret(":"+$(this).attr("id")+":");
					CropMaxLen();
					AddMembr('m23424','lolo');
				});
				
				$("#smiles").bind("click", function(e){
					$("#sml").toggle();
				});
				
				var find_nick = new RegExp('^\[[a-zA-Zа-яА-ЯеЁ0-9]+\]\,?');
				
				$("#membrs span, #chat span").live("click", function(e){
					var curr_msg = $("#msgout").val();
					if(find_nick.test(curr_msg)) curr_msg = curr_msg.replace(/^\[[a-zA-Zа-яА-ЯеЁ0-9]+\]\,?/,'');
					$("#msgout").val("["+$.trim($(this).text())+"]," + curr_msg);
				});
				
				var AddInChat = function( msg ){
					var firstDiv = $("#chat > div:first");
					firstDiv.hide();
					firstDiv.html(msg);
					$("#chat").append( firstDiv );
					firstDiv.show();
					$("#chat").scrollTop(10000000);
				}
				
				var AddMembr = function ( id, name ){
					$("#membrs").append("<span id='m"+id+"'>&nbsp;&nbsp;"+name+"</span> ");
				}
				
				try{
					var socket = io.connect('http://www.raktv.ru:843');
				} catch(e) {
					AddInChat('<p>Ошибка соединения!<br />'+e.name+': '+e.message+'</p>');
				} finally {
					$("#noscr").remove();
				}
			
				socket.on('connect', function () {
					
					$("#btn").bind("click", function(e){
						if(GLBLSND==false){
							GLBLSND=true;
							socket.send($("#msgout").val());
							$("#btn").html("Отправка");
						}
					});
					
					$('#msgout').keydown(function (e) {
						if (e.ctrlKey && e.keyCode == 13 && GLBLSND==false) {
							GLBLSND=true;
							socket.send($("#msgout").val());
						}
					});
					
					socket.on('message', function (msg) {
						$("#btn").html("Отправить в чат");
						
						switch(msg.event){
							case 'newmsg':
								AddInChat(msg.text);
							break
							case 'msganswr':
								if(msg.status == "error") {
										AddInChat("<p>Ваше сообщение не отправлено. Детали: "+msg.detail+"</p>");
										GLBLSND=false;
								} else if(msg.status == "ok") {
										AddInChat(msg.text);
										$("#msgout").val("");
										$("#btn").html("Отправить в чат");
										GLBLSND=false;
								}else{
									AddInChat("<p>Странная ошибка. Попробуйте еще раз.</p>");
									GLBLSND=false;
								}
							break
							case 'title':
								$(document).attr('title', msg.text);
							break
							case 'caption':
								$("#captnm").html(msg.text);
							break
							case 'player':
								$("#player").html(msg.text);
							break
							case 'thread':
								$("#linkthread").attr('href', msg.link);
								$("#linkthread").html(msg.name);
								AddInChat('<p>Обновлена ссылка на тред.</p>');
							break
							case 'refresh':
								document.location.reload();
							break
							case 'gosite':
								document.location.href=msg.link;
							break
							case 'clear':
								$("#chat > div").each(function() { $(this).empty(); });
								$("#chat > div:last").html('<br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />');
								$("#chat").scrollTop(10000000);
							break
							case 'lastmsg':
								$.each(msg.chatarg, function(index, value) { AddInChat(value); });
							break
							case 'deletem':
								$("#m"+msg.id).remove();
							break
							case 'addm':
								AddMembr(msg.id,msg.name);
							break
							case 'firstmsg':
								$(document).attr('title', msg.title);
								$("#captnm").html(msg.caption);
								$("#linkthread").attr('href', msg.link);
								$("#linkthread").html(msg.thread);
								$.each(msg.membrs, function(index, value) { AddMembr(value,index); });
								$.each(msg.chat, function(index, value) { if(value != '') AddInChat(value); });
								$("#player").html(msg.player);
							break
						}
					});
				});
				
				socket.on('reconnecting', function () {
					AddInChat('<p>Потерянна связь с чатом. Обновите страницу.</p>');
				});
				
				socket.on('error', function (e) {
					AddInChat('<p>Ошибка: ' + (e ? e.type : 'неизвестная ошибка') + '</p>');
				});
			});