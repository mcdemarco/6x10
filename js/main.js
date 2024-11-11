//
// This implementation of 6x10 is by M. C. DeMarco.
// It is released under a Creative Commons Attribution NonCommercial ShareAlike 3.0 License.
//

// Reduced jquery rewriting load.
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);


var main = {};

(function(context) { 

	var defaultSettings = {
												 magnification: false,
												 blackmoons: true,
												 level: '6x10',
												 randomizePC: false,
												 shift: 3,
												 matchToShift: true,
												 singleSuitRow: false,
												 hints: false,
												 undo: true
												};

	var version = "0.0.1";

	const debugging = true;
	const debugLevel = 0; //Turn up to 2 or off on release.
	const suitOrder = ["Moons","Suns","Waves","Leaves","Wyrms","Knots"];

//init
//data
//deal
//game
//logic
//settings
//ui
//debug


context.init = (function () {

	return {
		load: load
	};

	function load() {
		//The initialization function called on document ready.
		
		context.debug.init();
		context.settings.init();
		context.ui.init();
	
		context.settings.loadGame();
	}

})();



context.data = (function () {

	return {
		decodeDeck: decodeDeck,
		encodeDeck: encodeDeck,
		decodeTableau: decodeTableau,
		encodeTableau: encodeTableau,
		haveDeck: haveDeck,
		initializeDeck: initializeDeck,
		initializeTableau: initializeTableau,
		getCard: getCard,
		getColumns: getColumns,
		getDeckSize: getDeckSize,
		getRows: getRows,
		getSelected: getSelected,
		getTableau: getTableau,
		pushUndos: pushUndos,
		popUndos: popUndos,
		setSelected: setSelected,
		setTableau: setTableau,
		shuffle: shuffle,
		unsetSelected: unsetSelected,
		unsetTableau: unsetTableau
	};

	var deck, tableau;  //Don't store columns and rows as a separate variable.
	var selected; //Don't save selection with the game.
	var undoArr; //Don't save undo history with the game.

	function decodeDeck(encoding) {
		deck = JSON.parse(encoding);
		//JSON ate the sets.
		deck = context.deal.addSuitSets(deck);
	}

	function encodeDeck() {
		return JSON.stringify(deck);
	}

	function decodeTableau(encoding) {
		tableau = JSON.parse(encoding);
		//In this case we also need to derive rows and columns.
		//		console.log(tableau);
	}

	function encodeTableau() {
		return JSON.stringify(tableau);
	}

	function getDeckSize() {
    return haveDeck() ? deck.length : 0;
	}

	function haveDeck() {
    return !!(deck && deck.length)
	}

	function initializeDeck() {
		context.debug.log("Creating deck...",-2);

		// Build a deck of myrmex cards
		deck = context.deal.createDeck(getRows(),getColumns());
		// Building our data structure happens elsewhere.
		//initializeTableau();
	}

	function shuffle() {
		decktet.shuffle.deck(deck);
		//decktet.shuffle.sort(deck); // Sort to debugg deck structure.
	}

	function initializeTableau() {
		place(); //Also moves the cards back if replaying.
		context.debug.log(tableau,-3);
		context.deal.ace();
	}

	function place() {
		//Clear the tableau in case of size changes.
		tableau = new Array();
		//Edit the tableau to make initial placements.
		var rows = getRows();
		var columns = getColumns();
		context.debug.log("Math: " + rows + "x" + columns + " = " + (rows*columns) + " = " + deck.length, -3);
		var i;
		for (var r = 0; r < rows; r++) {
			tableau[r] = new Array();
			setTableau(r,0,-1); //Initial location of gaps is the zeroth column.
			for (var c = 0; c < columns; c++) {
				i = r * columns + c;
				setTableau(r,c+1,i);  //Just an index into the shuffled deck; c+1 leaves the blank for aces.
			}
		}
	}

	function getCard(idx) {
		if (idx == deck.length) {
			context.debug.log(deck,-3);
			context.debug.log(tableau,-3);
		}
		return deck[idx];
	}

	function getColumns() {
		var columns;
		if (tableau && tableau.length > 0) 
			columns = tableau[0].length - 1; //the column for gaps is not included
		else 
			columns = parseInt(context.settings.get('level').split("x")[1]);
		return columns;
	}

	function getRows() {
		var rows;
		if (tableau && tableau.length > 0) 
			rows = tableau.length;
		else 
			rows = parseInt(context.settings.get('level').split("x")[0]);
		return rows;
	}

	function getSelected() {
		return selected;
	}

	function popUndos() {
		var undo = undoArr ? undoArr.pop() : undefined;
		if (!undo || undoArr.length == 0) {
			//Disable the undo button.
			$("#undoButton").disabled = true;
		}
		return undo;
	}

	function pushUndos(undo) {
		if (!undoArr) 
			undoArr = [];
		undoArr.push(undo);

		//May need to enable the undo button.
		$("#undoButton").disabled = false;
	}

	function setSelected(row,col) {
		//Unhighlight any old one.
		unglowSelected();

		//Now set and highlight.
		selected = [row, col];
		context.ui.glow(row,col);
	}

	function unglowSelected() {
		//Also unhighlight.
		if (selected && selected.length)
			context.ui.unglow(selected[0],selected[1]);
	}

	function unsetSelected() {
		//Also unhighlight.
		unglowSelected();

		selected = [];
	}

	function getTableau(row,col) {
		return tableau[row][col];
	}

	function setTableau(row,col,idx) {
		tableau[row][col] = idx;

		//Also set images.
		var card = deck[idx];
		context.ui.setImage(row,col,card);
	}

	function unsetTableau() {
		tableau = [];
	}

})();



context.deal = (function () {
	//Didn't want to confuse matters by calling this "deck".

	return {
		ace,
		addSuitSets: addSuitSets,
		createDeck: createDeck,
		reload: reload
	};

	function createDeck(rows,columns) {

		// create a Myrmex deck for 6x12 or 3x12, then reduce columns.
		var myrmexDeck = decktet.create.deck((rows == 6 ? 2 : 1));

		// Always remove Excuses.
		myrmexDeck = decktet.remove.theExcuse(myrmexDeck);

		// Remove extra aces and crowns:
		if (rows == 6) {
			// Remove one set from a double deck.
			myrmexDeck = decktet.remove.rankByDeck(myrmexDeck,'Ace',2);
			myrmexDeck = decktet.remove.rankByDeck(myrmexDeck,'CROWN',2);
		} else {//rows == 3
			//From a single deck, remove half the aces and crowns at semi-random, 
			//according to Russ's instructions, plus the singleSuitRow setting.

			var suit1 = randomPop(['Moons','Knots']);
			var suit2 = randomPop(['Suns','Wyrms']);
			var suit3 = randomPop(['Waves','Leaves']);

			myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'Ace',suit1);
			myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'Ace',suit2);
			myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'Ace',suit3);

			if (context.settings.get('singleSuitRow')) {
				//Remove the same crown as the removed ace. 
				//This probably makes the game unwinnable, especially without pawns and crowns.
				myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'CROWN',suit1);
				myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'CROWN',suit2);
				myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'CROWN',suit3);
			} else {
				//Remove crowns at semi-random.
				myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'CROWN',randomPop(['Moons','Suns']));
				myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'CROWN',randomPop(['Waves','Wyrms']));
				myrmexDeck = decktet.remove.rankBySuit(myrmexDeck,'CROWN',randomPop(['Leaves','Knots']));
			}
		}

		//Remove extended deck cards depending on column count.
		if (columns == 10) {
			//Start unextending the deck.
			myrmexDeck = decktet.remove.pawns(myrmexDeck);
		}
		if (columns < 12) {
			//Unextend the deck (some more).
			myrmexDeck = decktet.remove.courts(myrmexDeck);
		}

		//Remove any extra Pawn(s) and Court(s).

		//In all cases we can remove the fourth Pawn or Court card(s) safely, 
		//because removing a card that isn't there is harmless.

		if (context.settings.get('randomizePC')) {
			//Remove a random pawn and court.
			var nixPawn = randomPop(['the BORDERLAND','the HARVEST','the LIGHT KEEPER','the WATCHMAN']);
			var nixCourt = randomPop(['the CONSUL','the ISLAND','the RITE','the WINDOW']);
			myrmexDeck = decktet.remove.cardByDeck(myrmexDeck,nixPawn,1);
			myrmexDeck = decktet.remove.cardByDeck(myrmexDeck,nixCourt,1);
			if (rows == 6) {
				//Remove another random pawn and court.
				nixPawn = randomPop(['the BORDERLAND','the HARVEST','the LIGHT KEEPER','the WATCHMAN']);
				nixCourt = randomPop(['the CONSUL','the ISLAND','the RITE','the WINDOW']);
				myrmexDeck = decktet.remove.cardByDeck(myrmexDeck,nixPawn,2);
				myrmexDeck = decktet.remove.cardByDeck(myrmexDeck,nixCourt,2);
			}
		} else {
			//Remove the Myrmex omissions, possibly doubly.
			myrmexDeck = decktet.remove.card(myrmexDeck,'the LIGHT KEEPER');
			myrmexDeck = decktet.remove.card(myrmexDeck,'the RITE');
		}

		context.debug.log("Deck of size " + myrmexDeck.length,-3);

		myrmexDeck = decktet.shuffle.deck(myrmexDeck);
		//myrmexDeck = decktet.shuffle.sort(myrmexDeck); // Sort to debug deck structure.
		for (var i = 0; i < myrmexDeck.length; i++) {
			//Tweak values for pawns and courts.
			if (myrmexDeck[i].Rank == "PAWN")
				myrmexDeck[i].Value = 10;
			if (myrmexDeck[i].Rank == "COURT")
				myrmexDeck[i].Value = 11;
			if (myrmexDeck[i].Rank == "CROWN")
				myrmexDeck[i].Value = columns;
		}

		myrmexDeck = addSuitSets(myrmexDeck);

		return myrmexDeck;
	}

	function addSuitSets(myrmexDeck) {
		//We need a separate function because JSON doesn't support sets.
		for (var i = 0; i < myrmexDeck.length; i++) {

			//Add a Set of suits to make suit comparisons easier.
			myrmexDeck[i].Suits = new Set();
			if (myrmexDeck[i].Suit1)
				myrmexDeck[i].Suits.add(myrmexDeck[i].Suit1);
			else
				continue;
			if (myrmexDeck[i].Suit2)
				myrmexDeck[i].Suits.add(myrmexDeck[i].Suit2);
			else
				continue;
			if (myrmexDeck[i].Suit3)
				myrmexDeck[i].Suits.add(myrmexDeck[i].Suit3);
			else
				continue;
		}

		return myrmexDeck;
	}

	function ace() {
		//Move the aces.  Don't sort.
		context.debug.log("Move the aces.",-2);
		var currentRow = 0;
		var idx;
		for (var r = 0; r < context.data.getRows(); r++) {
			for (var c = 1; c <= context.data.getColumns(); c++) {
				idx = context.data.getTableau(r,c);
				if (idx > -1 && (context.data.getCard(idx)).Rank == 'Ace') {
					context.data.setTableau(r,c,-1);
					context.data.setTableau(currentRow,0,idx);
					currentRow++;
				}
			}
		}
	}

	function reload() {
		//When reloading a tableau from storage, we need to redisplay the cards
		for (var r = 0; r < context.data.getRows(); r++) {
			for (var c = 0; c <= context.data.getColumns(); c++) {
				var idx = context.data.getTableau(r,c);
				context.ui.setImage(r,c,context.data.getCard(idx));
			}
		}
	}

  function randomPop(suits) {
		//Suits is an array.  It needn't be actual suits.
		//Also used to randomize Pawns and Courts.
		return suits[suits.length * Math.random() | 0];
	}

})();
	


context.game = (function () {

	return {
		checkVictory: checkVictory,
		newGame: newGame,
		reload: reload,
		replay: replay,
		undo: undo
	};

	function checkVictory() {
		//We don't want to constantly validate the tableau, 
		//so check for victory when a gap is made at the end of a row?
		//Currently just the button.
		if (context.logic.validateTableau()) {
			context.ui.win();
		} else {
			context.ui.errorizer('#validateButtonSpan');
		}
	}

	function newGame() {
		//It's important to nuke the tableau.
		context.data.unsetTableau();
		//In this case only, we decide whether we can reuse the deck or need to generate a new one.
		if (!context.data.haveDeck() || context.settings.checkForDeckChanges() || context.data.getRows() == 3) {
			//If certain values have changed since the deck was created, then we need to recreate it.
			//For 3xN, we need to regenerate the deck to randomize the Aces/Crowns, unless it's a replay.
			context.debug.log("Unwrapping a fresh decktet...",1);
			context.data.initializeDeck();
			//Shuffling and layout are part of initializeDeck, so we can skip those.
		} else {
			//Shuffle the old deck.
			context.debug.log("Shuffling...",1);
			context.data.shuffle();
		}
		game();
	}

	function reload(savedDeck,savedTableau) {
		context.debug.log("Loading saved game",0);
		//The other settings should match the deck now.
		context.data.decodeDeck(savedDeck);
		context.data.decodeTableau(savedTableau);
		game(context.settings.get('savedTime'));
	}

	function replay() {
		context.debug.log("Not shuffling...",1);
		game();
	}

	function game(savedTime) {
		//Clear the screen.
		clean();

		context.debug.log("Begin " + context.settings.get('level') + " game.",0);
		context.debug.log("Dims: " + context.data.getRows() + "x" + context.data.getColumns(), -3);

		if (savedTime) {
		 	context.deal.reload();
		} else {
			context.data.initializeTableau();
		}
		context.ui.initTimer(savedTime);

		//Rezoom here.
		context.ui.scaler();
	}

	function clean() {
		//Erase existing cards.
		$$(".cardspace").forEach(elt => elt.style.backgroundImage = "");

		//Unhighlight.  Don't really need both.
		context.ui.unglowAll();
		context.data.unsetSelected();

		var rows = context.data.getRows();
		var columns = context.data.getColumns();

		//Hide or show extra spaces.
		$$("div.twelvecols.cardspace").forEach(elt => elt.style.display = (columns < 12 ? "none" : "inline-block"));
		$$("div.elevencols.cardspace").forEach(elt => elt.style.display = (columns < 11 ? "none" : "inline-block"));
		$$("div.sixrows .cardspace").forEach(elt => elt.style.display = (rows == 3 ? "none" : "inline-block"));
		$$("div.sixrows div.twelvecols.cardspace").forEach(elt => elt.style.display = ((columns == 12 && rows == 6) ? "inline-block" : "none"));
		$$("div.sixrows div.elevencols.cardspace").forEach(elt => elt.style.display = ((columns > 10 && rows == 6) ? "inline-block" : "none"));

		//Clear any open panels.
		context.ui.show('');
	}

	function undo() {
		//Pop the undo stack and execute the unmove(s).
		context.debug.log("Start undoing", -2);
		var move = context.data.popUndos();
		context.debug.log(JSON.stringify(move),-2);
		if (move) {
			//Check if it's a sequence of moves (from a shift).
			if (move.shiftStart) {
				context.debug.log("Start undoing a shift...", -2);
				undoMove(move);
				for (var m = 1; m < context.settings.get('shift'); m++) {
					//Make sure we undo the full set of moves.
					context.debug.log("Auto undoing more shift", -2);
					undo();
				}
				context.debug.log("Done undoing a shift", -2);
			} else {
				undoMove(move);
			}
		}
		context.debug.log("Done undoing", -2);
	}

	function undoMove(move) {
		//Parse the unmove into Card to Gap format.
		context.logic.moveCardToGap(move.card[0],move.card[1],move.gap[0],move.gap[1]);
	}

})();



context.logic = (function () {

	return {
		click: click,
		moveCardToGap: moveCardToGap,
		validateTableau: validateTableau
	};

	function click(row,col) {
		//Clicks on aces have already been ignored.
		context.debug.log("Checking a click...", -2);

		//Get the new tableau value.
		var newsel = context.data.getTableau(row,col);

		//If this is a card and nothing else is selected, just set selected.
		if (newsel > -1 && context.data.getSelected().length == 0) {
			//New selection
			context.data.setSelected(row,col);
			return;
		}
		
		//If the new selection is a gap, make sure it's playable.  
		if (newsel == -1 && context.data.getTableau(row,col - 1) == -1) {
			//Gap to the left of us.
			var colright = col + 1;
			if (colright > context.data.getColumns() || context.data.getTableau(row,colright) == -1) {
				//Don't select this.
				context.debug.log("Tried to select a deep gap, which is unplayable", -2);
				var errSel = context.ui.getLocSelector(row,col);
				context.ui.errorizer(errSel);
				return;
			}
		}

		//If nothing is selected, this isn't a deep gap so just set selected.
		if (context.data.getSelected().length == 0) {
			//New selection
			context.data.setSelected(row,col);
			return;
		}

		//From here on we know the old selected is populated.
		var oldSelArr = context.data.getSelected();

		//Unset selected if reclicked.  Could use debounce time.
		if (oldSelArr[0] == row && oldSelArr[1] == col) {
			context.debug.log("Selected same", -2);
			//unset selected
			context.data.unsetSelected();
			return;
		}

		//From here on we need to know the tableau values for both.
		var oldsel = context.data.getTableau(oldSelArr[0],oldSelArr[1]);

		//If they're both spaces, or both cards, switch selected.
		if ((oldsel == -1 && newsel == -1) || (oldsel > -1 && newsel > -1)) {
			context.data.setSelected(row,col);
			return;
		}

		//We have a legit card and gap.  Pass to another function.
		checkSecond(row,col);
	}

	function checkMatch(card1,card2,fixedSuit) {
		//The last arg is for checking whether a particular suit is shared.
		context.debug.log("Checking a match...", -2);

		if (card2.Value != card1.Value + 1) {
			context.debug.log("Ranks not in sequence.", -2);
			return false;
		}

		var intersuit = (card1.Suits).intersection(card2.Suits);
		if (intersuit.size === 0) {
			context.debug.log("No suits matched between " + card1.Name + " and " + card2.Name, -2);
			return false;
		}

		if (fixedSuit && !(intersuit.has(fixedSuit))) {
			context.debug.log("Did not match the passed suit " + fixedSuit, -2);
			return false;
		}

		//We have a match!
		context.debug.log("We have a match of " + card1.Name + " to " + card2.Name,-2);
		return true;
	}

	function checkSecond(row,col) {
		context.debug.log("Checking a card against a gap...", -2);

		var oldSelArr = context.data.getSelected();
		var oldsel = context.data.getTableau(oldSelArr[0],oldSelArr[1]);
		var newsel = context.data.getTableau(row,col);

		//One is a card and one is a gap, so figure out which is which.
		var oldIsGap = !!(oldsel == -1);

		var gaprow = oldIsGap ? oldSelArr[0] : row;
		var gapcol = oldIsGap ? oldSelArr[1] : col;
		var cardrow = oldIsGap ? row : oldSelArr[0];
		var cardcol = oldIsGap ? col : oldSelArr[1];
		var card = context.data.getCard(oldIsGap ? newsel : oldsel);

		//At this point we can check the special Crown case.
		//Note that there has to be enough room to left of the crown for a full sequence.

		context.debug.log("Checking for a Crown shift situation...", -3);
		if (card.Rank == 'CROWN' 
				&& gaprow == cardrow 
				&& gapcol == parseInt(cardcol,10) + 1
				&& parseInt(cardcol,10) >= context.settings.get('shift')
			 ) {

			context.debug.log("Checking a Crown shift...", -2);

			var shifted = checkShift(cardrow,cardcol,card);
			if (shifted) {
				//shifting was done by checkShift, but need to unset selection
				context.data.unsetSelected();
			} else {
				//Last one clicked is the new selection.
				context.data.setSelected(row,col);
			}
			//Either way, we're done so...
			return;
		}
		
		//At this point we need to know the neighbors of the gap.
		//There must be a left neighbor, but possibly not a right, 
		//so check the left neighbor first.
		context.debug.log("Checking selected card against the card to the left of the gap...", -2);

		var idxLeft = context.data.getTableau(gaprow, gapcol - 1);
		if (idxLeft > -1) {
			var cardLeft = context.data.getCard(idxLeft);
			if (!!checkMatch(cardLeft,card)) {
				//Passed the test so move the card and reset selections.
				context.debug.log("Match passed back to controlling function.", -3);
				moveCardToGapWithUndos(cardrow,cardcol,gaprow,gapcol);
				return;
			}
			//Otherwise, we move on without any conclusions yet.
			context.debug.log("Match fail passed back to controlling function.", -3);
		}

		//If we're still here, we check the right neighbor.
		var colright = parseInt(gapcol,10) + 1;
		if (colright > context.data.getColumns()) {
			//The gap is up against the right end.
			context.debug.log("The gap is up against the right end column " + context.data.getColumns(), -2);
			//However, we may have one corner case to check here.
			if (idxLeft == -1 && !oldIsGap) {
				//We don't want to select a gap betwixt gaps so just...
				return;
			} else {
				//Switch selection to the new space or card and return.
				context.data.setSelected(row,col);
				return;
			}
		}

		//Otherwise we check the right card the same as the left card.
		context.debug.log("Checking selected card against the card to the right of the gap...", -2);

		var idxRight = context.data.getTableau(gaprow, colright);
		if (idxRight > -1) {
			var cardRight = context.data.getCard(idxRight);
			if (checkMatch(card,cardRight)) {
				//Passed the test so move the card and reset selections.
				moveCardToGapWithUndos(cardrow,cardcol,gaprow,gapcol);
				return;
			}
		}

		//If we're still here, we've checked all cases but the gap corner case.
		if (idxRight == -1 && idxLeft == -1 && !oldIsGap) {
			//We don't want to select a gap betwixt gaps so just...
			return;
		} else {
			//Switch selection to the new space or card and return.
			context.data.setSelected(row,col);
			return;
		}
	}

	function checkShift(cardrow,cardcol,card) {
		//Initial card is the CROWN.
		context.debug.log("Checking a shift...", -2);
		var fixedSuit = card.Suit1;  //The selected card is a crown so has only one suit.
		var useFixedSuit = context.settings.get('matchToShift') ? fixedSuit : false;

		var prevCard, prevCardIdx, errSel;
		for (var c=cardcol - 1; c > cardcol - context.settings.get('shift'); c--) {
			//We do a loop from 1 to shift, checking each pair for a match, 
			// possibly with the matchToShift condition.
			prevCardIdx = context.data.getTableau(cardrow,c);

			if (prevCardIdx == -1) {
				//Fail on gaps.
				errSel = context.ui.getLocSelector(cardrow,c);
				context.ui.errorizer(errSel);
				return false;
			}

			prevCard = context.data.getCard(prevCardIdx);
			if (!checkMatch(prevCard,card,useFixedSuit)) {
				errSel = context.ui.getLocSelector(cardrow,c);
				context.ui.errorizer(errSel);
				return false;
			}
			card = prevCard;
		}

		//If we got this far, we need to do the shifting.
		var theShift = context.settings.get('shift');
		for (c=cardcol; c > cardcol -  theShift; c--) {
			//Move each into the gap.
			moveCardToGapWithUndos(cardrow,c,cardrow,parseInt(c,10) + 1, (c == cardcol - theShift + 1));
		}

		//Return true or false so the caller can resolve the selection state.
		return true;
	}

	function moveCardToGap(cardrow,cardcol,gaprow,gapcol) {
		//The prime mover.
		context.debug.log("Moving the card...", -2);

		var cardIdx = context.data.getTableau(cardrow,cardcol);
		//Move the card to the gap.
		context.data.setTableau(gaprow,gapcol,cardIdx);
		//Replace card with a gap.
		context.data.setTableau(cardrow,cardcol,-1);

		//Autosave every time.  It would be possible but clunky to wait until the end of a shift.
		context.settings.saveGame();
	}

	function moveCardToGapWithUndos(cardrow,cardcol,gaprow,gapcol,isShiftStart) {
		//Move.
		moveCardToGap(cardrow,cardcol,gaprow,gapcol);

		//Undoable
		if (context.settings.get('undo')) {
			var undoObj = {gap: [cardrow,cardcol],
										 card: [gaprow,gapcol],
										 shiftStart: isShiftStart ? true : false
										};
			context.data.pushUndos(undoObj);
		}

		//We unset selection here for convenience.
		context.data.unsetSelected();
	}

	function validateTableau() {
		//A special matching function where we ignore gaps, 
		//so the user doesn't have to move everything leftward.
		context.debug.log("Validating tableau...", -2);
		var singleSuitedRows = context.settings.get('singleSuitRow');
		var rows = context.data.getRows();
		var columns = context.data.getColumns();

		var cardLeft, cardRightIdx, cardRight, rowSuit;
		for (var r = 0; r < rows; r++) {
			//This is the ace and cannot be a gap.
			cardLeft = context.data.getCard(context.data.getTableau(r,0));
			rowSuit = cardLeft.Suit1;

			for (var c = 1; c <= columns; c++) {
				cardRightIdx = context.data.getTableau(r,c);
				if (cardRightIdx == -1) {
					//How we skip gaps.
					continue;
				}

				//Have a right hand card to check.
				cardRight = context.data.getCard(cardRightIdx);
				if (!checkMatch(cardLeft,cardRight,singleSuitedRows ? rowSuit : false)) {
					context.debug.log("Tableau invalid.", -2);
					//Mark cardRight wrong.
					var errSel = context.ui.getLocSelector(r,c);
					context.ui.errorizer(errSel);
					return false;
				}
				cardLeft = cardRight;
			}
		}
		context.debug.log("Tableau valid.", -2);
		return true;
	}

})();



context.settings = (function () {

	return {
		init: init,
		checkForChanges: checkForChanges,
		checkForConflicts: checkForConflicts,
		checkForDeckChanges: checkForDeckChanges,
		get: get,
		set: set,
		reset: reset,
		loadGame: loadGame,
		saveGame: saveGame
	};

	function init() {
		//Initialize settings during page init.
		context.debug.log("Getting settings...",0);
		
		// need magnification to set up the button
		// This is a little awkward but never got cleaned up
		if (get('magnification') == true) {
			$('body').classList.add('magnify');
			$('#plusButton').innerText = "Normal";
		}
		$('#plusButton').addEventListener("click", () => {
			if ($('body').classList.contains('magnify')) {
				$('body').classList.remove('magnify');
				set('magnification',false);
				$('#plusButton').innerText = "Enlarge";
			} else {
				$('body').classList.add('magnify');
				set('magnification',true);
				$('#plusButton').innerText = "Normal";
			}
		});
		
		//Fill in the rest of the settings form
		$("input#emblacken").checked = get('blackmoons');
		$("input#l" + get('level')).checked = true;
		$("input#s" + get('shift')).checked = true;
		$("input#randomizePC").checked = get('randomizePC');
		$("input#matchToShift").checked = get('matchToShift');
		$("input#singleSuitRow").checked = get('singleSuitRow');
		//$("input#hints").checked = get('hints');
		$("input#undo").checked = get('undo');
	}

	function checkForChanges() {
		//We don't set the level here, but we do turn off the replay button in some cases.
		var currentVariant = get('level');
		var newVariant = $("input[name=level]:checked").value;
		//Turn off replay.
		if (currentVariant != newVariant)
			$("#replayButton").disabled = true;
		else
			$("#replayButton").disabled = false;

		//We do set and use all other settings.
		if (get('shift') != $("input[name=shift]:checked").value || 
			  get('blackmoons') != $("input#emblacken").checked || 
			  get('randomizePC') != $("input#randomizePC").checked || 
			  get('matchToShift') != $("input#matchToShift").checked || 
			  get('singleSuitRow') != $("input#singleSuitRow").checked || 
			  //get('hints') != $("input#hints").checked || 
			  get('undo') != $("input#undo").checked) {

			context.debug.log("Settings change detected.",-1);
			set('shift', ($("input[name=shift]:checked").value).toString());
			set('blackmoons', ($("input#emblacken").checked).toString());
			set('randomizePC', ($("input#randomizePC").checked).toString());
			set('matchToShift', ($("input#matchToShift").checked).toString());
			set('singleSuitRow', ($("input#singleSuitRow").checked).toString());
			//set('hints', ($("input#hints").checked).toString());
			set('undo', ($("input#undo").checked).toString());

			if (get('undo') == false) {
				//The undo button will turn itself on but not off so off it.
				$("#undoButton").disabled = true;
			}

			return true;
		} else {
			return false;
		}
	}

	function checkForConflicts(ev) {
		//The level can conflict with single suiting, causing unwinnable games.
		var sss = $("input#singleSuitRow").checked;
		var lev = $("input[name=level]:checked").value;
		var rows = lev.split('x')[0];

		if (!sss || rows == 6) {
			//Enable in case of previous disability.
			$("input#singleSuitRow").disabled = false;
		} else {
			//Don't mess with levels.
			$("input#singleSuitRow").checked = false;
			$("input#singleSuitRow").disabled = true;
		}
	}

	function checkForDeckChanges() {
		//We don't abort the game on a level change; level doesn't change until New is pressed,
		//so we don't actually set the setting until then.
		if (get('level') != $("input[name=level]:checked").value) {
			set('level', $("input[name=level]:checked").value);
			//May need to turn on replay.
			$("#replayButton").disabled = false;
			return true;
		} else if (get('randomizePC') && context.data.getColumns() > 10) {
			//Need to change the deck to randomize the pawns and courts.
			return true;
		} else if (context.data.getDeckSize() != context.data.getColumns() * context.data.getRows()) {
			//Need to change the deck because the level doesn't match the previous, probably saved, game.
			return true;
		} else {
			return false;
		}
	}

	function get(setting) {
		if (window.localStorage && typeof window.localStorage.getItem(setting) !== 'undefined' && window.localStorage.getItem(setting) !== null) {
			var value;
			try {
				value = window.localStorage.getItem(setting);
			} catch (e) {
				value = defaultSettings[setting];
			}
			if (setting == 'blackmoons' || setting == 'magnification' || setting == 'randomizePC' || setting == 'matchToShift' || setting == 'singleSuitRow' || setting == 'hints' || setting == 'undo')  
				value = (value.toLowerCase() === "true");
			if (setting == 'shift')
				value = parseInt(value,10);
			return value;
		} else {
			return defaultSettings[setting];
		}
	}

	function set(setting, value) {
		if (window.localStorage) {
			try {
				window.localStorage.setItem(setting, value);
				return true;
			} catch (e) {
				return false;
			}
		} else {
			return false;
		}
	}

	function unset(setting) {
		if (window.localStorage) {
			try {
				window.localStorage.removeItem(setting);
				return true;
			} catch (e) {
				return false;
			}
		} else {
			return false;
		}
	}

	function reset() {
		//Reset all settings to defaults, shortcutting via localStorage.
		try {
			window.localStorage.clear();
			window.location.reload();
		} catch(e) {
			context.debug.log("Failed to clear local storage due to: " + e);
		}
	}
	
	function loadGame() {
		if (get('savedTime')) {
			context.game.reload( get('savedDeck'), get('savedTableau'));
		}
	}

	function saveGame() {
		context.debug.log("Autosaving current game",-2);
		set('savedDeck',context.data.encodeDeck());
		set('savedTableau',context.data.encodeTableau());
		//We get the saved level from the saved tableau.
		//We don't set it, but maybe we should.
		//set('savedLevel',get('level'));
		set('savedTime',$("#timer").innerText);
	}

})();
	


context.ui = (function () {

	return {
		card: card,
		errorizer: errorizer,
		getLocSelector: getLocSelector,
		glow: glow,
		init: init,
		initTimer: initTimer,
		scaler: scaler,
		setImage: setImage,
		show: show,
		showPanel: showPanel,
		unglow: unglow,
		unglowAll: unglowAll,
		win: win
	};

	var timer;

	function card(ev) {
		//We have some logic here in that we don't pass on an Ace click.
		if (ev.target.classList.contains("cardspace") && ev.target.dataset.col > 0) {
			//ev.target.classList.toggle("selected");
			context.logic.click(parseInt(ev.target.dataset.row,10),parseInt(ev.target.dataset.col,10));
		}
	}

	function errorizer(errSel) {
		$(errSel).classList.add('error');
		window.setTimeout(function(){
			$(errSel).classList.remove('error');
		},5000);
	}

	function glow(row,col) {
		//Can also use to unglow, at the risk of getting into an incorrect state.
		$("div.cardspace[data-row='" + row + "'][data-col='" + col + "']").classList.toggle("selected");
	}

	function displayTimer(total_seconds) {
		//Code from http://stackoverflow.com/a/2605236/4965965
		function pretty_time_string(num) {
			return ( num < 10 ? "0" : "" ) + num;
		}

		var hours = Math.floor(total_seconds / 3600);
		total_seconds = total_seconds % 3600;
		
		var minutes = Math.floor(total_seconds / 60);
		total_seconds = total_seconds % 60;
		
		var seconds = Math.floor(total_seconds);
		
		// Pad the minutes and seconds with leading zeros, if required
		hours = pretty_time_string(hours);
		minutes = pretty_time_string(minutes);
		seconds = pretty_time_string(seconds);
		
		// Compose the string for display
		var currentTimeString = (hours != "00" ? hours + ":" : "") + minutes + ":" + seconds;
		
		return currentTimeString;
	}

	function init() {
		//Init buttons.
			
		// set up the click events for the panels

		$('#panelLinks').addEventListener('click', (ev) => {
			context.ui.showPanel(ev);
		});

		$$('.close.button').forEach( el => el.addEventListener('click', () => {
			context.ui.show()
		}
		));
		
		// events for the start/replay/undo/check buttons
		$('#startButton').addEventListener('click', () => {
			context.game.newGame();
		});
		$('#replayButton').addEventListener('click', () => {
			context.game.replay();
		});

		$('#validateButton').addEventListener('click', () => {
			context.game.checkVictory();
		});

		$('#undoButton').addEventListener('click', () => {
			context.game.undo();
		});

		// special settings panel events
		$('#resetButton').addEventListener('click', () => {
			context.settings.reset();
		});
		$('div#settingsPanel button.close').addEventListener('click', () => {
			context.settings.checkForChanges();
		});

		//Card selection.
		$('#playarea').addEventListener('click', (ev) => {
			context.ui.card(ev);
		});

		//single suit validation
		$$('input.sss').forEach( el => el.addEventListener('change', (ev) => {
			context.settings.checkForConflicts(ev);
		}
		));

		//Resize listener.
		//window.onresize = context.ui.scaler;
		var resizeDebouncer;
		window.onresize = function(){
			clearTimeout(resizeDebouncer);
			resizeDebouncer = setTimeout(context.ui.scaler, 100);
		};

		//Game should be correctly sized at this point.
		context.ui.scaler();
	}

	function initTimer(atTime) {
		//Code from http://stackoverflow.com/a/2605236/4965965
		if (timer)
			clearInterval(timer);
		var elapsed_seconds = 0;
		//atTime is a string in the pretty-printed format produced by the timer.
		if (atTime) {
			var atTimes = atTime.split(":");
			if (atTimes.length == 3) 
				elapsed_seconds = parseInt(atTimes[0],10) * 3600 + parseInt(atTimes[1],10) * 60 + parseInt(atTimes[2],10);
			else
				elapsed_seconds = parseInt(atTimes[0],10) * 60 + parseInt(atTimes[1],10);
			//Set timer to get accurate win time when opening a won game.
			$('#timer').innerText = displayTimer(elapsed_seconds);
		}
		timer = setInterval(function() {
			elapsed_seconds = elapsed_seconds + 1;
			$('#timer').innerText = displayTimer(elapsed_seconds);
		}, 1000);
	}
	
	function scaler() {
		context.debug.log("Scaling...", -2);
		var rows = context.data.getRows() || 6;
		var columns = context.data.getColumns() + 1 || 13;
		/*
			sidebarWidth = 125;
			playarea padding 10px;
			cardSize = [174,124];
			card margin 4px;
			card size for multiplication = [182,132]
		*/
		var playheight = rows * 182 + 30;
		var playwidth = columns * 138 + 20;  //Not sure how the cards are getting wider.

		var scale = Math.min( 
			window.innerHeight / playheight,
			(window.innerWidth - 100) / playwidth
		);

		if (scale < 1) {
			$("#playarea").style.transform = 'scale(' + scale + ')';
 			$("#playarea").style.transformOrigin = '0 0';
		}
	}

	function setImage(row,col,card) {
		var sel = getLocSelector(row,col);
		if (!card) {
			$(sel).style.backgroundImage = "";
			return;
		}
		var emblacken = context.settings.get('blackmoons');
		var cardImage = card.Image;
		if (emblacken && (card.Suit1 == "Moons" || card.Suit2 == "Moons" || card.Suit3 == "Moons"))
			cardImage = cardImage.split(".png")[0] + "_black.png";

		$(sel).style.backgroundImage = "url('cards/" + cardImage + "')";
	}

	function getLocSelector(row,col) {
		return "div#tableau" + row + "-" + col;
	}

	function showPanel(ev) {
		//Get the panel Id and pass it to show.
		if (ev.target.dataset.panel)
			show(ev.target.dataset.panel);
	}

	function show(panelID) {
		//Is it showing?
		var showing = panelID ? !!($("#" + panelID).style.display == "block") : false;
		//Is settings showing?
		var settingsShowing = panelID ? !!($("#settingsPanel").style.display == "block") : false;

		//Hide all.
		$$(".panel").forEach( el => el.style.display = "none" );

		//Toggle requested panel.
		if (panelID && !showing) {
			$("#" + panelID).style.display = "block";
		}
		
		//Was settings showing?
		if (settingsShowing) {
			//We closed it, either en masse or for the toggle, so run the close checker.
			context.settings.checkForChanges();
		}

		//In all cases (this function also closes panels) scroll to top.
		window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
	}

	function unglow(row,col) {
		//Pure unglow for inits as well.
		$("div.cardspace[data-row='" + row + "'][data-col='" + col + "']").classList.remove("selected");
	}

	function unglowAll() {
		//Clear all selections, e.g., for a new round.  Ideally there would be only one but just in case...
		$$("div.cardspace.selected").forEach(el => el.classList.remove("selected"));
	}
	
	function win(delayUnits) {
		clearInterval(timer);
		//Add time and meaning.
		var yourTime = $("#timer").innerText.split(":");
		if (yourTime.length == 3) //[hrs,mins,secs]
			yourTime = parseInt(yourTime[0]) * 60 + parseInt(yourTime[1]);
		else //[mins,secs]
			yourTime = parseInt(yourTime[0]);
		$("#minutes").innerHTML = yourTime;
		context.ui.show('gameOver');
	}

})();


context.debug = (function () {

	return {
		init: init,
		log: log
	};

	function init() {
		//Write the version number somewhere semi-visible to fight with the appcache.
		var span = document.createElement("span");
		span.innerText = " " + version + ".";
		$("#versionP").appendChild(span);
		log("Initializing...",0);
	}
	
	function log(message,level) {
		/* Log levels 
		-3: obsolete
		-2: extreme
		-1: chatty
		 0: basic code path
		 1: current details
		 2: current concerns
		 3: real errors
		*/
		if (!debugging || (!level && level !== 0) || level < debugLevel) return;
		var timestamp = new Date();
		console.log(timestamp.toLocaleTimeString() + ": " + message);
	}

})();

})(main);

/* eof */
