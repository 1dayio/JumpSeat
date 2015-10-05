"use strict";

/**
 * Pathway Model
 * @author Mike Priest
 * @type {{url: string}}
 */
Aero.model.pathway = {

	/**
	 *  Services URL
	 */
	url : "api/pathway"
};

/**
 * Pathway View
 * @author Mike Priest
 * @type {{render: Function, setEvents: Function}}
 */
Aero.view.pathway = {

	/**
	 *  Render steps in the menu list
	 */
	render : function(pathways, index){

        $q('.aero-here').remove();

		try {
			var title = pathways[index].title;
			var id = pathways[index].id;

			//Render pathway guides
			if(index == 0){
				Aero.guide.getAll(function(guides){
					Aero.view.guide.render(guides);
				});
			}else if(index == pathways.length - 1){

                Aero.onpage.getGuides(function(guides){
                    guides[0].path = "On This Page";
                    Aero.view.guide.render(guides);
                });
            }else{
				Aero.pathway.getGuides(id, function(guides){
					guides[0].path = title;
					guides[0].pathid = id;
					Aero.view.guide.render(guides);
				});
			}

			aeroStorage.setItem("aero:pathway", index);
			aeroStorage.setItem("aero:pathway:name", title);

			return true;
		} catch(err){
			return false;
		}
	},


	/**
	 *  Set event handlers
	 */
	setEvents : function(){
		var self = this;

		$q('body').off('click.aeropath').on('click.aeropath', '.aero-carousel a:not(".aero-share")', function(){

			var isPrev = $q(this).hasClass('aero-left');
			Aero.pathway.get(function(r){

				var id = null;
				var ls = aeroStorage.getItem("aero:pathway");
				var size = r.length - 1;
				var index = ls ? ls : 0;

				//Navigate
				if(isPrev) index--; else index++;
				if(index < 0) index = size;
				if(index > size) index = 0;

				self.render(r, index);
			});
			return false;
		});
	}
};

/**
 * Pathway Object
 * @author Mike Priest
 * @type {{init: Function, get: Function, getGuides: Function}}
 */
Aero.pathway = {

	/**
	 *  Initialize
	 */
	init: function(){
		Aero.view.pathway.setEvents();
	},

	/**
	 *  Get pathways
	 */
	get : function(callback, id){

		//Cache
		if(Aero.constants.PATHWAYS){
			callback(Aero.constants.PATHWAYS);
			return;
		}

		var data = {};
			data.dropEmpty = true;
			data.count = true;
			data.select = ['title'];
		if(id) data = { id : id };

		Aero.send(Aero.model.pathway.url, data, function(r){
            r.unshift({ 'title': AeroStep.lang.allguides });
			r.push({ 'title': 'On This Page' });

			Aero.constants.PATHWAYS = r;
			if(callback) callback(r);
		}, "GET");
	},


	/**
	 *  Get guides for pathway
	 */
	getGuides : function(pathwayid, callback){

		//Setup once
		if(!Aero.constants.pathway) Aero.constants.pathway = {};

		//Already exists
		if(Aero.constants.pathway && Aero.constants.pathway[pathwayid]){
			callback(Aero.constants.pathway[pathwayid]);
			return;
		}

		//Call server
		Aero.send("api/pathwaymap/by_pathway", { active : true, pathwayid : pathwayid }, function(r){
			Aero.constants.pathway[pathwayid] = r;
			if(callback) callback(r);
		}, "GET");
	}
};


/**
 * Pathway to display guides on page
 * @type {{getGuides: Function, render: Function}}
 */
Aero.onpage = {

    /**
     * Get valid onpage guides
     * @param callback
     */
    getGuides : function(callback){

        var _this = this;
        var onPage = [];
        var mycallback = callback;

        Aero.guide.getAll(function(guides){

            for(var i in guides){
                var step = guides[i].step[0];

                if(step){
                    //Don't use first step orphans
                    if(step.position && step.position == "orphan"){
                        step = guides[i].step[1];
                    }

                    if(step.loc == "body") break;
                    if(step.noUrl == "all" || step.url == AeroStep.getSubURL(window.location.pathname)){
                        onPage.push(guides[i]);
                    }
                }
            }

            _this.render(onPage);
            if(callback) callback(onPage);
        });
    },

    /**
     * Render on page guides
     * @param guides
     */
    render : function(guides){

        var count = 0;

        for(var i in guides) {
            var step, $el, off, $tpl;

            step = guides[i].step[0];

            //Don't use first step orphans
            if(step.position && step.position == "orphan"){
                step = guides[i].step[1];
            }


            $el = $q(step.loc);
            off = $el.offset();

            //if (!$el.hasClass('ae-here')){

                $el.addClass('ae-here').data('ae-id', count);
                $tpl = $q('<a id="ae-id-'+count+'" class="aero-here">X</a>');

                $tpl
                    .css({
                        top: off.top - 20,
                        left: off.left - 37
                    })
                    .data('guideids', guides[i].id);

                count++;
            //}else{
            //
            //    // @todo allow multi guide on single link
            //    var id = $el.data('ae-id');
            //    var guideids = $q('#ae-id-' + id).data('guideids');
            //
            //    $q('#ae-id-' + id).data('guideids', guides[i].id);
            //}

            $q('body').append($tpl);
            this.setEvents();
        }
    },

    /**
     *  Set Triggers
     */
    setEvents : function(){

        //Click on page pulse
        $q('.aero-here').off('click.aeop').on('click.aeop', function(){
            Aero.tip.start($q(this).data('guideids'));

            $q('.aero-here').remove();
        });
    }
}


