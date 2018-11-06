/*
Copyright (C) 2017-2018  Barry de Graaff

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
*/

function tk_barrydegraaff_useralias_HandlerObject() {
   tk_barrydegraaff_useralias_HandlerObject.settings = {};
};

tk_barrydegraaff_useralias_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_useralias_HandlerObject.prototype.constructor = tk_barrydegraaff_useralias_HandlerObject;
var UserAliasZimlet = tk_barrydegraaff_useralias_HandlerObject;

UserAliasZimlet.prototype.init = function () {
   var section = {
      title: 'Alias',
      icon: 'tk_barrydegraaff_useralias-panelIcon',
      //templateId: 'tk_barrydegraaff_useralias.templates.preferences' + '#Preferences',
      priority: 49,
      manageDirty: true,
      prefs: [
         'MySetting',
      ],
      createView: function(parent, sectionObj, controller) {
         return new UserAliasZimletPrefs(parent, sectionObj, controller, appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_useralias').handlerObject);
      }
   };
   ZmPref.registerPrefSection('USERALIAS_PREFERENCES', section);
};

/* status method show a Zimbra status message
* */
UserAliasZimlet.prototype.status = function(text, type) {
   var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.FADE_OUT ];
   appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
}; 

UserAliasZimlet.prototype._cancelBtn =
function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_useralias').handlerObject;
   
   try{
      zimletInstance._dialog.setContent('');
      zimletInstance._dialog.popdown();
   }
   catch (err) {}
};

UserAliasZimletPrefs = function(shell, section, controller, handler) {
   if (!arguments.length) return;
   this._createHtml = function(){return document.createTextNode("");};
   
   this.getHtmlElement = function()
   {
      g = document.createElement('div');
      g.setAttribute("id", "tk_barrydegraaff_useralias_prefscreen");
      g.setAttribute("class", "ZmPreferencesPage ZWidget");
      return g;
   };
   
   this.setScrollStyle = function(){return 'none';};
   this.hideMe = function()
   {
      document.getElementById('tk_barrydegraaff_useralias_prefscreen').style='display:none';
      document.getElementById('zb__PREF__SAVE').style='display:block';
      return;
   };
   this.resetSize = function(){return;};
   this.setVisible = function(){return;};
   
   this.showMe = function()
   {
      UserAliasZimlet.prototype.showMeImpl();
   };
   
   this.getTabGroupMember = function(){return;};
   this.hasResetButton = function(){return false;};
   this.getTitle = function(){return 'User Alias';};
   
   this._handler = handler;
   ZmPreferencesPage.call(this, shell, section, controller);
};

UserAliasZimlet.prototype.showMeImpl = function()
{
   document.getElementById('zb__PREF__SAVE').style='display:none';
   document.title = "Zimbra: " + ZmMsg.preferences +": Alias";
   document.getElementById('tk_barrydegraaff_useralias_prefscreen').style='display:block';
   document.getElementById('tk_barrydegraaff_useralias_prefscreen').innerHTML = "<h2 class='prefHeader'>Current Alias</h2><div id='tk_barrydegraaff_useralias_prefscreen_currentAlias'></div><h2 class='prefHeader'>Permissions</h2><div id='tk_barrydegraaff_useralias_prefscreen_permissions'></div><h2 class='prefHeader'>Add alias</h2><div id='tk_barrydegraaff_useralias_addAlias'><input type='text' placeholder='alias' id='tk_barrydegraaff_useralias_newAlias'>@<select id='tk_barrydegraaff_useralias_newAliasDomain'></select><button onclick='UserAliasZimlet.prototype.addAlias()'>add</button></div>";
   
   var soapDoc = AjxSoapDoc.create("userAlias", "urn:userAlias", null);
   var params = {
      soapDoc: soapDoc,
      asyncMode: true,
      callback:UserAliasZimlet.prototype.displayPerms
   };
   soapDoc.getMethod().setAttribute("action", "getAllowedAlias");
   appCtxt.getAppController().sendRequest(params);
   
   var soapDoc = AjxSoapDoc.create("userAlias", "urn:userAlias", null);
   var params = {
      soapDoc: soapDoc,
      asyncMode: true,
      callback:UserAliasZimlet.prototype.displayAlias
   };
   soapDoc.getMethod().setAttribute("action", "getAlias");
   appCtxt.getAppController().sendRequest(params);
   
   return;   
};

UserAliasZimlet.prototype.displayPerms = function(result)
{
   try{
   var result = result._data.response._content.split(",");
   document.getElementById('tk_barrydegraaff_useralias_prefscreen_permissions').innerHTML = "You are allowed to create alias in the following domains:<br><br>";
   var i;
   for (i = 1; i < result.length; i++) { 
      if(result[i].length > 0)
      {
         document.getElementById('tk_barrydegraaff_useralias_prefscreen_permissions').innerHTML += result[i] + "<br>";      
         var option = document.createElement("option");
         option.text = result[i];
         option.value = "@"+result[i];
         var select = document.getElementById("tk_barrydegraaff_useralias_newAliasDomain");
         select.appendChild(option);
      }
   }

   document.getElementById('tk_barrydegraaff_useralias_prefscreen_permissions').innerHTML += "<br>Maximum number of alias allowed on your account: " + result[0];
   
   
   } catch (err)
   {
      document.getElementById('tk_barrydegraaff_useralias_prefscreen_permissions').innerHTML = err;
   }
};

UserAliasZimlet.prototype.displayAlias = function(result)
{
   try{
   var result = result._data.response._content.split(",");

   document.getElementById('tk_barrydegraaff_useralias_prefscreen_currentAlias').innerHTML = "These addresses are currently configured as alias on your account, mail sent to these addresses will be delivered to your mailbox:<br><br>";

   var i;
   var added = false;
   for (i = 0; i < result.length; i++) { 
      if(result[i].length > 0)
      {      
         document.getElementById('tk_barrydegraaff_useralias_prefscreen_currentAlias').innerHTML += result[i] + " <a style=\"text-decoration:underline !important; color: blue !important; cursor:pointer\" onclick=\"UserAliasZimlet.prototype.removeAlias('"+result[i]+"') \">remove</a><br>";
         added = true;
      }   
   }
   
   if(!added)
   {
      document.getElementById('tk_barrydegraaff_useralias_prefscreen_currentAlias').innerHTML = 'There is no alias configured on your account. Add an alias to receive email on additional addresses.<br>'
   }
   
   } catch (err)
   {
      document.getElementById('tk_barrydegraaff_useralias_prefscreen_currentAlias').innerHTML = err;
   }
};

UserAliasZimlet.prototype.removeAlias = function(alias)
{
      var soapDoc = AjxSoapDoc.create("userAlias", "urn:userAlias", null);
      var params = {
         soapDoc: soapDoc,
         asyncMode: true,
         callback:UserAliasZimlet.prototype.displayResult
      };
      soapDoc.getMethod().setAttribute("action", "removeAlias");
      soapDoc.getMethod().setAttribute("alias", alias);
      appCtxt.getAppController().sendRequest(params);
};

UserAliasZimlet.prototype.addAlias = function()
{
   var alias = document.getElementById('tk_barrydegraaff_useralias_newAlias').value+document.getElementById('tk_barrydegraaff_useralias_newAliasDomain').value;
      var soapDoc = AjxSoapDoc.create("userAlias", "urn:userAlias", null);
      var params = {
         soapDoc: soapDoc,
         asyncMode: true,
         callback:UserAliasZimlet.prototype.displayResult
      };
      soapDoc.getMethod().setAttribute("action", "createAlias");
      soapDoc.getMethod().setAttribute("alias", alias);
      appCtxt.getAppController().sendRequest(params);
};

UserAliasZimlet.prototype.displayResult = function(result)
{
   result = result._data.response._content;
   
   if(result=="end of command")
   {
      UserAliasZimlet.prototype.status('OK', ZmStatusView.LEVEL_INFO);
   } 
   else
   {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_useralias').handlerObject;
      zimletInstance.displayErrorMessage(
         result.replace("end of command",""),
         undefined,
         "Server Result"
      );
   }   
     
   UserAliasZimlet.prototype.showMeImpl();
};
