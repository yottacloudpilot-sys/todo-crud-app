import { Router } from 'express';
import * as todosController from '../controllers/todosController';

const router = Router();

router.post('/', todosController.createTodo);
router.get('/', todosController.listTodos);
router.get('/:id', todosController.getTodo);
router.patch('/:id', todosController.updateTodo);
router.delete('/:id', todosController.deleteTodo);

export default router;
