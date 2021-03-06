import Faze from './components/Core/Faze';
import Helpers from './components/Helpers/Helpers';

// Навешивание общих события ядра
Faze.bind();

// Инициализация плагинов по data атрибутам
Faze.hotInitialize();

// Инициализация помощников
Helpers.initialize();

// @ts-ignore
window.Faze = Faze;

if (Faze.getVersion() === 1 || true) {
  // Faze.Carousel = Faze.Carousel2;
}

// Faze.Helpers.setElementStyle(document.querySelector('[name="product_chr_search"]'), {width: '123px'});
// Faze.Helpers.setElementAttributes(document.querySelector('[name="product_chr_search"]'), {width: '123px'});

// const nodes = document.querySelectorAll('.js-viewport-test');
// window.addEventListener('scroll', () => {
//   console.log(Faze.Helpers.isElementsInViewport(nodes, 100, true));
// });

// new Faze.Modal(document.querySelector('#button'), {
//   title: 'Тестирование модального окна',
//   url: 'https://jsonplaceholder.typicode.com/todos/1',
//   // html: '<p>Hello!</p>',
//   draggable: true,
//   buttons: [
//     {
//       caption: 'Закрыть',
//       class: 'btn btn-close',
//       callback: (parts: any) => {
//         parts.closeButton.click();
//       },
//     },
//   ],
// });

Faze.add({
  pluginName: 'Global',
  callback: () => {
    const a = 10;

    return {a};
  }
});

// Тесты
Faze.add({
  pluginName: 'ObserveTest',
  condition: document.querySelectorAll('.js-notification').length > 0,
  observableSelector: '.js-notification',
  callback: () => {
    document.querySelectorAll('.js-notification').forEach((buttonNode) => {
      buttonNode.addEventListener('click', () => {
        // console.log(123);
      });
    });
  },
});

// Тесты
Faze.add({
  pluginName: 'Tests',
  condition: document.querySelectorAll('.js-carousel-test1').length > 0,
  callback: () => {
    new Faze.Carousel(document.querySelector('.js-carousel-test1'), {
      autoplay: false,
      pages: true,
      arrows: true,
      // arrowsOutside: true,
      counter: false,
      infinite: false,
      mouseMove: false,
      // amountPerSlide: 2,
      animation: {
        type: 'fade',
        time: 1000,
        direction: 'horizontal',
      },
      callbacks: {
        created: (data: any) => {
          // console.log(data);
        },
        changed: ({currentSlideNode}: { currentSlideNode?: any }) => {
          // console.log(currentSlideNode);
        },
      },
    });
  }
});

// Тесты
Faze.add({
  pluginName: 'Tests',
  condition: document.querySelectorAll('#button').length > 0,
  callback: () => {
    Faze.Helpers.setCookie('test', 'test');

    new Faze.Tooltip(document.querySelector('#button'), {
      text: '123',
      side: 'right',
    });

    new Faze.Filter(document.querySelector('.js-filter'), {
      tableName: 'product',
      hasButton: true,
      modules: {
        get: '123',
      },
    });

    new Faze.Tab(document.querySelector('.faze-tabs'), {
      useHash: true,
    });

    new Faze.Dropdown(document.querySelector('.js-dropdown'));

    const fazeSelect = new Faze.Select(document.querySelector('.faze-select'), {
      default: true,
      callbacks: {
        created: (data: any) => {
          // console.log(data);
        },
        opened: (data: any) => {
          // console.log('opened', data);
        },
        changed: (data: any) => {
          // console.log('changed', data);
        },
      },
    });

    fazeSelect.setValue('Выбор 2');

    const carousel = new Faze.Carousel(document.querySelector('.carousel-test'), {
      autoplay: false,
      pages: true,
      arrows: true,
      // arrowsOutside: true,
      counter: false,
      infinite: false,
      mouseMove: false,
      // amountPerSlide: 2,
      animation: {
        type: 'fade',
        time: 1000,
        direction: 'horizontal',
      },
      selectors: {
        arrowLeft: '.js-test-arrow-left',
        arrowRight: '.js-test-arrow-right',
      },
      callbacks: {
        created: (data: any) => {
          // console.log(data);
        },
        changed: ({currentSlideNode}: { currentSlideNode?: any }) => {
          // console.log(currentSlideNode);
        },
      },
    });

    const carouselChangeButtonNode = document.querySelector('.js-notification');
    if (carouselChangeButtonNode) {
      carouselChangeButtonNode.addEventListener('click', () => {
        carousel.change(0);
      });
    }

    // carousel.changeAnimationDirection('vertical');

    new Faze.Zoom(document.querySelector('.image'), {
      side: 'right',
    });
    // console.log(zoom);

    new Faze.Spoiler(document.querySelector('.spoiler-test'));

    new Faze.Scroll(document.querySelector('.for-scroll'), {
      width: '100%',
      height: '300',
    });

    new Faze.Form(document.querySelector('.form-order'), {
      callbacks: {
        error: (data: any) => {
          // console.log(data);
        },
      },
    });

    new Faze.Page(document.querySelector('.news .items'), {
      offset: 10,
      quantity: 10,
      tableName: 'list',
      modules: {
        get: 111222,
      },
    });

    const slider = new Faze.Slider(document.querySelector('.js-slider'), {
      callbacks: {
        changed: (data: any) => {
          // console.log(data.values);
        },
      },
    });

    const button = document.querySelector('.slider-reinitialize');
    if (button) {
      button.addEventListener('click', () => {
        slider.reinitialize({
          range: [0, 100],
        });
      });
    }

    // slider.setValues([0, 100], true);
    // slider.reset();

    // new Faze.Gallery(document.querySelectorAll('.image-product'), {});

    Faze.on('click', '.test-on', () => {
      Faze.REST.chain([
        {
          method: 'POST',
          module: '287707',
          response_html: '.faze-dropdown',
          callback: (response: any) => {
            // console.log(response);
          },
        },
        'test',
      ]);
    });

    Faze.on('submit', 'form[data-faze-restapi-form]', (event, node: any) => {
      event.preventDefault();

      Faze.REST.formSubmit(node, (response: any) => {
        // console.log(response);
      });
    });

    const dataAttrButton = document.querySelector('[data-faze-restapi-attr]');
    if (dataAttrButton) {
      dataAttrButton.addEventListener('click', () => {
        Faze.REST.dataAttr(dataAttrButton);
      });
    }

    const notificationButtonNode = document.querySelector('.js-notification');
    if (notificationButtonNode) {
      notificationButtonNode.addEventListener('click', () => {
        Faze.Helpers.showNotification('Тест', {
          isNested: false,
        });
      });
    }

    // let testObject = {};
    //
    // testObject = Faze.Helpers.objectFromString(testObject, 'offer.news', 'title', 'Hello!');
    // testObject = Faze.Helpers.objectFromString(testObject, 'offer.news', 'date', 'today');
    // testObject = Faze.Helpers.objectFromString(testObject, 'test', 'author', 'me');
    // testObject = Faze.Helpers.objectFromString(testObject, '', 'day', 'good');
    // testObject = Faze.Helpers.objectFromString(testObject, 'offer.manager.contacts', 'name', 'max');
    // testObject = Faze.Helpers.objectFromString(testObject, 'house.address', 'name', 'max');
    //
    // console.log(testObject);
  },
});

// Тест Faze.Drag
Faze.add({
  pluginName: 'Faze.Drag Test',
  condition: document.documentElement.classList.contains('js-drag'),
  callback: () => {
    new Faze.Drag(document.querySelectorAll('.js-drag-test'), {
      callbacks: {
        created: () => {
          console.log('Создание прошло успешно');
        },
        beforeDrag: () => {
          console.log('Начинаем перетаскивание');
        },
        drag: () => {
          console.log('Перетаскиваем');
        },
        afterDrag: () => {
          console.log('Заканчиваем перетаскивание');
        },
      },
    });
  },
});
