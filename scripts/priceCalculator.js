const keysToDelete = ['Артикул','manufacturer_warranty (for YML)','запросить цену, подобрать замену','Картинка заглушка','Уникальный текст','Источник ввода','Исполнитель','Акция промокод','Акция подарки','Акция id','Тестовая три','Тестовая два','Тестовая один','[СРАВН. ТАБЛИЦЫ]','[СЕО текст]','[СЕО картинки]','[PDF]','Реклама Директ','[ТОЧНЫЕ ГАБАРИТЫ]','[ГАБАРИТЫ ИЗ ИНТЕРНЕТА]','Объем (в упаковке)','Группа минимального заказа','Скрипт для менеджеров','Поставщик данные','Информация для менеджеров','Пусто описание','Нашли дешевле','Наценка','Время оформления заказа','Срок доставки','Стоимость доставки','Возможность самовывоза','Возможность доставки','Запрос маркет','Кнопка маркет','Скидка на комплект, сумма','Скидка на комплект, %','Новинка','Market_ru (выгрузка)','Наличие Маркет','Яндекс Маркет','Ссылка на статью','Альтернативное изображение','Sales_Notes (for YML)','Количество загрузок (раз)','Количество дней для скачивания','Файл продукта','Ограничение на минимальный заказ продукта (штук)','Бесплатная доставка','Вес продукта','Стоимость упаковки','meta keywords','Заголовок (только <b>title</b>)','Заголовок основной (title + h1)','Сортировка','Продано','Старая цена','Можно купить','Скрытый','Название вида налогов','PriceEUR','PriceUSD','PriceRUR','ЧПУ старый 1','ЧПУ старый 2','ЧПУ старый 3','ЧПУ старый 4','ЧПУ старый 5','Группа номенклатуры','Вид номенклатуры'];

priceForm.onsubmit = async (e) => {
  e.preventDefault();
  const inputValues = document.forms.priceForm;

  const priceList = {
    charPriceConst: Number(inputValues.charPrice.value),
    photoPriceConst: Number(inputValues.imgPrice.value),
    tableShortDescriptionPriceConst: Number(inputValues.tblDescPrice.value),
    videoPriceConst: Number(inputValues.vidPrice.value),
    accAddPriceConst: Number(inputValues.accAddPrice.value),
    descriptionSymbolCostConst: Number(inputValues.descrPrice.value) / 1000,
    SAQBonusConst: inputValues.saqCheckbox.checked ? Number(inputValues.saq.value) / 100 : 0,
    leaderBonusConst: inputValues.leaderCheckbox.checked ? Number(inputValues.leadBonus.value) / 100 : 0,
    englishBonus: Number(inputValues.engBonus.value) / 100,
    seriesDecreaseValue: Number(inputValues.unifMod.value) / 100
  };
  
  let jsonRequest = new Request('data/74-epson-projectors.json');
  fetch(jsonRequest)
  .then(function(response) {
      return response.json();
  })
  .then(function(data) {
      return netPrice(data);
  })

  let netPrice = function (json) {
    const regexFlex = new RegExp('flex');
    const regexIframe = new RegExp('/iframe');
    const regexDoubleComma = new RegExp(':');
    let priceObject = {
      photoPrice: 0,
      tableShortDescPrice: 0,
      videoPrice: 0,
      descriptionPrice: 0,
      accPrice: 0,
      charPrice: 0,
      totalItems: json.length,
      photoCounter: 0,
      tableShortDescCounter: 0,
      videoCounter: 0,
      descriptionSymbolCount: 0,
      accCounter: 0,
      charCounter: 0,
      englishModifierCounter: 0,
      uniformityModifierCounter: 0,
      netPrice: function () {return (this.photoPrice + this.tableShortDescPrice + this.videoPrice + this.descriptionPrice + this.accPrice + this.charPrice);},
      SAQBonus: function () {return (this.netPrice() * priceList.SAQBonusConst);},
      managerTotalPrice: function () {return (this.netPrice() + this.SAQBonus());},
      leaderBonus: function () {return (this.netPrice() * priceList.leaderBonusConst);},
      totalPrice: function () {return (this.managerTotalPrice() + this.leaderBonus());}
    };
    let modifierCalculator = function (elmnt) {
      if (elmnt.isEnglish && elmnt.isSeries) {
        priceObject.englishModifierCounter++;
        priceObject.uniformityModifierCounter++;
        return (1 + priceList.englishBonus - priceList.seriesDecreaseValue);
      } else if (elmnt.isEnglish && !elmnt.isSeries) {
        priceObject.englishModifierCounter++;
        return (1 + priceList.englishBonus);
      } else if (elmnt.isSeries && !elmnt.isEnglish) {
        priceObject.uniformityModifierCounter++;
        return (1 - priceList.seriesDecreaseValue);
      } else return (1);
    }
    let spamCleaner = function (elmnt) {
      let spamKeys = [];
      keysToDelete.forEach(function(ktd) {
        spamKeys.push(ktd);
      });
      for (let key in elmnt) {
        if (key !== 'isEnglish' && key !== 'isSeries' && elmnt[key] === '') spamKeys.push(key);
      }
        spamKeys.forEach(function(sk) {
          delete elmnt[sk];
        });
    }
    json.forEach(function (element) {
      let  descriptionSymbolCalc = function (descr) {
        priceObject.descriptionSymbolCount += descr.replace(/\s+/g, '').length;
        priceObject.descriptionPrice += priceList.descriptionSymbolCostConst * descr.replace(/\s+/g, '').length * modCalc;
      }
      const modCalc = modifierCalculator(element);
      spamCleaner(element);
      for (let key in element) {
        if (key !== 'isEnglish' && key !== 'isSeries') {
          if (key.includes('Фотография')) {
            priceObject.photoCounter++;
            priceObject.photoPrice += priceList.photoPriceConst * modCalc;
           } else if (regexFlex.test(element[key])) {
            priceObject.tableShortDescCounter++;
            priceObject.tableShortDescPrice += priceList.tableShortDescriptionPriceConst * modCalc;
          } else if (key === 'Видео') {
            priceObject.videoCounter += element[key].split(regexIframe).length - 1;
            priceObject.videoPrice += priceList.videoPriceConst * (element[key].split(regexIframe).length - 1) * modCalc;
          } else if (key.includes('СТ ')) {
            priceObject.accCounter += element[key].split(regexDoubleComma).length;
            priceObject.accPrice += priceList.accAddPriceConst * element[key].split(regexDoubleComma).length;
          } else if (key === 'Описание') descriptionSymbolCalc(element[key]);
          else {
            priceObject.charCounter++;
            priceObject.charPrice += priceList.charPriceConst * modCalc;
          }
        }
      }   
    });

    document.getElementById('itemsCount').innerHTML = `Количество добавленных товаров: ${priceObject.totalItems} ед.`;
    document.getElementById('charCount').innerHTML = `Количество добавленных характеристик: ${priceObject.charCounter} ед.`;
    document.getElementById('tableShortDescCount').innerHTML = `Количество табличных кратких описаний ${priceObject.tableShortDescCounter} ед.`;
    document.getElementById('photosCount').innerHTML = `Количество добавленных фотографий: ${priceObject.photoCounter} ед.`;
    document.getElementById('symbolsCount').innerHTML = `Количество символов в описаниях: ${priceObject.descriptionSymbolCount} симв.`;
    document.getElementById('videosCount').innerHTML = `Количество добавленных видео: ${priceObject.videoCounter} ед.`;
    document.getElementById('accAddCount').innerHTML = `Количество проведенных товаров: ${priceObject.accCounter} ед.`;
    document.getElementById('englishModifier').innerHTML = `Добавлено товаров с англоязычных ресурсов: ${priceObject.englishModifierCounter} ед.`;
    document.getElementById('uniformityModifier').innerHTML = `Количество однообразных товаров: ${priceObject.uniformityModifierCounter} ед.`;
    document.getElementById('netCost').innerHTML = `Цена задачи без бонуса исполнителю: ${Math.round(priceObject.netPrice())} руб.`;
    document.getElementById('workerBonus').innerHTML = `Бонус исполнителю за скорость и качество: ${Math.round(priceObject.SAQBonus())} руб. (${(priceList.SAQBonusConst * 100)} %)`;
    document.getElementById('workerToPay').innerHTML = `К оплате исполнителю: ${Math.round(priceObject.managerTotalPrice())} руб.`;
    document.getElementById('leaderBonus').innerHTML = `Бонус ведущему: ${Math.round(priceObject.leaderBonus())} руб. ( ${(priceList.leaderBonusConst * 100)} %)`;
    document.getElementById('fullCost').innerHTML = `Общая стоимость задачи: ${Math.round(priceObject.totalPrice())} руб.`;
  }

};
