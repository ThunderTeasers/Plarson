/**
 * Модуль ядра - Observer
 *
 * Предоставляет возможность автоматической инициализации плагинов по data атрибутам при динамическом создании DOM элементов на странице
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 03.05.2019
 */

/**
 * Структура слушателя плагина
 *
 * Содержит:
 *   selector             - CSS селектор DOM элемента который надо отслеживать
 *   callback             - пользовательский метод, исполняющийся при добавлении нового элемента с указанным селектором,
 *                          передает его DOM элемент
 *   alreadyExistedNodes  - список уже существующих DOM элементов с указанным селектором
 */
interface Listener {
  selector: string;
  callback: (addedNode: HTMLElement) => void;
  alreadyExistedNodes: HTMLElement[];
}

/**
 * Класс Observer
 */
class Observer {
  // Список слушателей
  readonly listeners: Listener[];

  // Основной объект observer'а
  mutationObserver: MutationObserver;

  constructor() {
    // Инициализация переменных
    this.listeners = [];

    // Инициализируем сам observer
    this.mutationObserver = new MutationObserver(this.check.bind(this));
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Добавление слушателя к общему списку
   *
   * @param selector - CSS селектор DOM элемента для отслеживания
   * @param callback - пользовательский метод, исполняющийся после добавления нужного DOM элемента
   */
  watch(selector: string, callback: (addedNode: HTMLElement) => void) {
    this.listeners.push({
      selector,
      callback,
      alreadyExistedNodes: Array.from(document.querySelectorAll(selector)),
    });
  }

  /**
   * Отслеживание всех изменений DOM элементов на сайте
   *
   * @param mutationRecords - список изменения
   */
  private check(mutationRecords: MutationRecord[]) {
    // Проходимся по всем слушателям
    this.listeners.forEach((listener: Listener) => {
      // Проходимся по всем изменениям
      mutationRecords.forEach((mutationRecord: MutationRecord) => {
        // Проходимся по всем добавленым DOM элементам
        mutationRecord.addedNodes.forEach((addedNode: Node) => {
          const parentNode = addedNode.parentNode;
          if (parentNode) {
            // Делаем выборку по селектору у родителя вставленного элемента, для того чтобы избежать случая, когда в "addedNode"
            // передаются элементы которые не соответствуют заданному в "listener" селектору
            parentNode.querySelectorAll(listener.selector).forEach((insertedElement) => {
              // Если этого элемента не было изначально, то исполняем заданную пользовательскую функцию
              if (!Array.from(listener.alreadyExistedNodes).includes(<HTMLElement>insertedElement)) {
                if (typeof listener.callback === 'function') {
                  try {
                    // Вызываем пользовательскую функцию
                    listener.callback(<HTMLElement>insertedElement);
                  } catch (error) {
                    console.error('Ошибка исполнения пользовательской функции переданной в Observer, текст ошибки: ', error);
                  }

                  // Обновляем уже существующие элементы у слушателя, чтобы при следующем добавлении элемента, пользовательская
                  // функция срабатывала только на последний, а не на все которые были добавлены после инициализации
                  listener.alreadyExistedNodes.push(<HTMLElement>insertedElement);
                }
              }
            });
          }
        });

        // Проходимся по всем удаленным DOM элементам и убираем их из массива существующих элементов слушателя, чтобы не засорять его и
        // очистить память
        mutationRecord.removedNodes.forEach((removedNode: Node) => {
          listener.alreadyExistedNodes.forEach((existedNode: HTMLElement) => {
            if (existedNode === removedNode) {
              listener.alreadyExistedNodes = listener.alreadyExistedNodes.filter(node => node !== existedNode);
            }
          });
        });
      });
    });
  }
}

export default Observer;
