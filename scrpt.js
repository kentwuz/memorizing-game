const GAME_STATE = { //狀態分為5種:
  FirstCardAwaits: 'FirstCardAwaits', //第一個卡片點擊前
  SecondCardAwaits: 'SecondCardAwaits',//第二個卡片點擊前
  CardsMatchFailed: 'CardsMatchFailed',//卡片配對失敗
  CardsMatched: 'CardsMatched',//卡片配對成功
  GameFinished: 'GameFinished' //完成遊戲
}

const Symbols = [ //卡片上標誌，採Array方式表示(0~3) 
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]
//MVC 架構 + Utility分類
const view = { //可視化功能分類
  getCardElement(index) { //產生容器HTML功能 : 傳入的index可以替卡片加上data-index的位置訊息，會知道是哪張卡牌。同時產生出一張卡牌的"容器"HTML程式碼
    return `<div data-index="${index}" class="card back"></div>`
  },

  getCardContent(index) { //定義卡片數字以及符號功能+產生內部HTML程式碼 : 傳入的index可以替卡片加上data-index的位置訊息，會知道是哪張卡牌
    const number = this.transformNumber((index % 13) + 1) //這個裡面的this 應是指view 這個變數，帶入transformNumber主要是需要將1 = A ,11 = J ..等撲克牌才會出現的內容成現出來。會除以13是因為一個花色的牌是13張，所以如果說第14張應該會是index 13(第二個花色的1) , 13%13 + 1 = 1 。 
    const symbol = Symbols[Math.floor(index / 13)] //預設花色會是從0開始，最高不超過3

    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  },

  transformNumber(number) { //switch 會依照傳入的參數(number)比對其中的case，比對中了就執行。
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  displayCards(indexes) { //將卡片html渲染至前端功能
    const rootElement = document.querySelector('#cards') //rootElement 選擇到前端的#cards DOM
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('') //#cards部位的內部html = 傳入的所有indexs作迭代(採用.map方式)，其中每一個index 會帶入getCardElement，並將index 存在data-index中。
  },

  flipCards(...cards) { //翻牌呈現功能: 展開運算子，將陣列中的卡片各自展開代入
    cards.map(card => {
      if (card.classList.contains('back')) { //將牌翻開的判斷式: 如果cards中的class元素含有"back" (表示還沒有翻開)
        card.classList.remove('back') //將"back"從class中移除
        card.innerHTML = this.getCardContent(Number(card.dataset.index)) //card中的html = 將之前getcardElement中所儲存的data-index函數轉換成數字之後，代入getCardContent中，渲染出"翻開牌"的內容
        return
      }
      card.classList.add('back') //替card的class加上 "back"的 元素，將牌翻回
      card.innerHTML = null //把卡片中原來渲染的數字以及花色移除
    })
  },

  pairCards(...cards) { //配對成功函式 :
    cards.map(card => {
      card.classList.add('paired') //替翻開的卡片都加上"paired"的class , 主要是底色會變成灰色
    })
  },

  renderScore(score) { //顯示目前分數函式
    document.querySelector('.score').textContent = `Score: ${score}` //score的 class其中的文字會代入動態score分數
  },

  renderTriedTimes(times) { //顯示目前嘗試了幾次的函式
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },

  appendWrongAnimation(...cards) { //配對錯誤之動畫效果 : 代入之cards
    cards.map(card => {
      card.classList.add('wrong') //cards array中每張卡都加上 "wrong"這個class
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true }) //加入一個監聽器: 在動畫結束後"animationend"，把當卡片的"wrong"class移除，這樣子重複點擊才會有一樣的效果。同時最後面加上once: true 就是當執行一次結束後就移除監聽器，這樣好維持網頁效能。
    })
  },

  showGameFinished() { //遊戲結束顯示之函式: 
    const div = document.createElement('div') //創建一個div容器

    div.classList.add('completed') //於此div容器中加上"completed"的class
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    ` //內容加上分數以及嘗試的次數
    const header = document.querySelector('#header')
    header.before(div) //element.before 是將div其中的內容加在#header (也就是所有的內容)之前
  }
}

const model = { //MODEL("M"VC) :資料儲存
  revealedCards: [], //每次翻開兩張牌的儲存區

  isRevealedCardsMatched() { //是否配對成功判斷函式
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13 //如果翻開的第一張卡[0]其中的data-index在除以13後 = 翻開第二章卡[1]一樣其中data-index除13後是相等的，表示他們的數字是相等的。
  },

  score: 0,

  triedTimes: 0
}

const controller = { //CONTROLLER(MV"C") : 判斷區
  currentState: GAME_STATE.FirstCardAwaits, //開始的狀態為:等待第一張牌翻開的狀態

  generateCards() { //創造卡片函式:
    view.displayCards(utility.getRandomNumberArray(52))
  }, //將52張卡代入getRandomNumberArray這個洗牌的函式中，並且產生一個陣列，並且再代入到view中的displayCards將卡片背面的html代入並渲染。

  dispatchCardAction(card) { //翻開卡片的判斷函式 : 代入參數card
    if (!card.classList.contains('back')) { //如果卡片的list沒有包含back這個class，則中斷
      return
    }

    switch (this.currentState) { //switch 比對目前card的state狀態
      case GAME_STATE.FirstCardAwaits: //如果是還沒翻開第一張牌的狀態的話(就是點了第一張牌翻開)
        view.flipCards(card) //執行view中翻牌flipCard的函示
        model.revealedCards.push(card) //將翻開的卡push儲存在revealCards的Array中
        this.currentState = GAME_STATE.SecondCardAwaits //將目前卡片的state狀態改為等待翻開第二張牌
        break

      case GAME_STATE.SecondCardAwaits: //如果是還沒翻開第二張牌狀態的話(就是點了第二張牌翻開)
        view.renderTriedTimes(++model.triedTimes) //將model中的triedTimes+1 , 並且代入view中的renderTriedTimes函數中

        view.flipCards(card) //翻開牌
        model.revealedCards.push(card) //一樣將翻開的卡片push儲存在revealedCards中

        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) { //配對成功函式
          // 配對成功
          view.renderScore(model.score += 10) //將分數+10分，並且代入view中的renderScore函式中

          this.currentState = GAME_STATE.CardsMatched //將狀態改為配對成功
          view.pairCards(...model.revealedCards) //將revelCards中的卡片加上灰色底 (pairCards函式)
          model.revealedCards = [] //將revealCards中的資料清空，等待下一次翻牌

          if (model.score === 260) { //遊戲結束函式: 如果分數 =260分的話，則遊戲結束
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished() //代入view中顯示分數以及嘗試次數的函式，並且結束
            return
          }

          this.currentState = GAME_STATE.FirstCardAwaits //重新改為等待第一次牌翻開的狀態
        } else { //配對失敗函式
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed //狀態改為: 配對失敗
          view.appendWrongAnimation(...model.revealedCards) //將原來儲存在revealedCards Array中的卡，代入view中配對失敗的動畫
          setTimeout(this.resetCards, 1000) //等待一秒以後，執行resetCards的函示
        }
        break
    }
    console.log('this.currentState', this.currentState) //**這行好像不是很必要
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index)) //**這行好像不是很必要
  },

  resetCards() { //翻回卡的功能函式
    view.flipCards(...model.revealedCards) //將翻開的卡牌代入執行flipCards的函式，因為已經翻開，沒有back這個class，所以會將back的class加回，重新變成覆蓋狀態
    model.revealedCards = [] //將revealedCards中的資料清除
    controller.currentState = GAME_STATE.FirstCardAwaits //將狀態重新定義回等待第一張卡牌翻開
  }
}

const utility = { //將牌亂數洗牌的函示
  getRandomNumberArray(count) { //count決定有多少張牌(count)
    const number = Array.from(Array(count).keys()) //用array.from產生出有count張牌的陣列
    for (let index = number.length - 1; index > 0; index--) { //從最後一張牌開始
      let randomIndex = Math.floor(Math.random() * (index + 1)) //抽出一個於index數目中的任意數字
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] //將最後一張牌與這個任意數字(位置)的牌調換
    }
    return number
  }
}

controller.generateCards()

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})
