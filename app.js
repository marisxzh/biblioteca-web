const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const ejs = require('ejs');
const path = require('path');

const app = express();
const port = 3000;

//criando a conexão com o banco
const db = mysql.createConnection({
  host: 'localhost',
  user:'root',
  password: '',
  database:'biblioteca'
});

//conectando com o banco
db.connect((error) => {
if(error){
  console.error('Erro ao conectar ao MySQL:', error)
}else{
  console.log("Conectado ao MySQL!")
}
});

app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'));
app.use(express.static('src'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get(['/', '/home'], (req, res) => {
  res.render('home');
});

app.get('/acervo', (req, res) => {
  db.query('SELECT a.nome as "autor", l.titulo, l.ISBN, l.ano_publicacao FROM livro l JOIN autor a on l.id_autor = a.id_autor', (error, results) => {
    if (error) {
      console.log ('Houve um erro ao recuperar os livros')
    } else {
      res.render('acervo', {livros: results})
    }
  })
});


// get é diferente de post
// get pega do query (url) e post pega do body
app.get('/pesquisarLivros', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
    db.query('SELECT a.nome as autor, l.titulo, l.ISBN, l.ano_publicacao from livro l join autor a on l.id_autor = a.id_autor where l.titulo like ? or a.nome like ?', [`%${pesquisa}%`, `%${pesquisa}%`], (error, results) => {
      if (error) {
        console.log ('Ocorreu um erro ao realizar o filtro')
      } else {
        res.render ('acervo', {livros: results})
      }
    });
})


const carregarAutores = (callback) => {
db.query('SELECT * from autor order by nome', (error, results) => {
  if (error) {
    console.log ('Erro ao carregar autores', error);
  } else {
    const autores = results.map(results => results)
    callback(null, autores);
  }
    })
  };


  app.get ('/livro', (req, res) => {
    const ISBN = req.query.ISBN;
    console.log(ISBN)
    carregarAutores((error, listaAutores) =>{
      db.query('SELECT * FROM livro WHERE ISBN=?', [ISBN], (error, results) =>{
        if(error){
          console.log ('Erro ao buscar o livro com ISBN', ISBN)
        } else {
          if(results.length > 0){
            res.render('livro', {autores: listaAutores, livro: results[0]});
          }else{
            console.log('Livro não encontrado')
          }
        }
      })
    })
  });


  app.post ('/editarLivro', (req, res) => {
    const ISBN = parseInt(req.body.inputISBN)
    const id_Autor = parseInt(req.body.inputAutor)
    const titulo = (req.body.inputTitulo)
    const ano_publicacao = (req.body.inputAnoPublicacao)
    const genero = (req.body.inputGenero)
    const resumo = (req.body.textResumo)

    db.query('UPDATE livro set ISBN = ?, titulo = ?, id_autor = ?, ano_publicacao = ?, genero = ?, resumo = ? where ISBN = ?', [ISBN, titulo, id_Autor, ano_publicacao, genero, resumo, ISBN], (error, results) => {
      if(error){
        console.log ('Erro ao editar livro.')
      }else {
        res.redirect('/acervo')
      }
    })
  });


  app.post('/excluirLivro/:ISBN', (req,res) => {
    const ISBN = parseInt(req.params.ISBN)
    console.log (ISBN)
    db.query('DELETE from livro WHERE ISBN = ?', [ISBN], (error, results) =>{
      if (error){
        console.log ('Erro ao excluir livro')
      } else {
        res.redirect('/acervo')
      }
    })
  })


  app.get('/emprestimo', (req, res) => {
    db.query('select e.id_emprestimo, e.id_livro, e.id_usuario, date_format(e.data_emprestimo, "%d/%m/%y") as "data_emprestimo", date_format(e.data_devolucao, "%d/%m/%y") as "data_devolucao", u.nome, l.titulo from emprestimo e join usuario u on e.id_usuario = u.id_usuario join livro l on l.ISBN = e.id_livro', (error, results) => {
      if (error) {
        console.log ('Houve um erro ao recuperar os emprestimos')
      } else {
        res.render('emprestimo', {emprestimos: results})
      }
    })
  });

  app.get('/pesquisarEmprestimo', (req, res) => {
    const pesquisa = req.query.pesquisa;
    console.log(pesquisa)
      db.query('SELECT e.id_emprestimo, e.id_livro, e.id_usuario, e.data_emprestimo, e.data_devolucao, u.nome, l.titulo FROM emprestimo e JOIN usuario u ON u.id_usuario = e.id_usuario JOIN livro l ON l.ISBN = e.id_livro WHERE l.titulo LIKE ? OR u.nome LIKE ?;', [`%${pesquisa}%`, `%${pesquisa}%`], (error, results) => {
        if (error) {
          console.log ('Ocorreu um erro ao realizar o filtro')
        } else {
          res.render ('emprestimo', {emprestimos: results})
        }
      });
  });


  const carregarUsuarios = (callback) => {
    db.query('SELECT * from usuario order by nome', (error, results) => {
      if (error) {
        console.log ('Erro ao carregar usuarios', error);
      } else {
        const usuarios = results
        callback(null, usuarios);
      }
        })
      };


      const carregarLivros = (callback) => {
        db.query('SELECT * from livro order by titulo', (error, results) => {
          if (error) {
            console.log ('Erro ao carregar livros', error);
          } else {
            const livros = results
            callback(null, livros);
          }
            })
          };


  app.get ('/infoEmprestimo', (req, res) => {
    const id = req.query.id_emprestimo;
    console.log(id)
    carregarUsuarios((error, listaUsuarios) =>{
      carregarLivros((error, listaLivros) =>{
        db.query('SELECT * FROM emprestimo WHERE id_emprestimo=?', [id], (error, results) =>{
          if(error){
            console.log ('Erro ao buscar o emprestimo com id_emprestimo', id)
          } else {
            if(results.length > 0){
              res.render('infoEmprestimo', {livros: listaLivros, emprestimo: results[0], usuarios: listaUsuarios});
            }else{
              console.log('Deu erro')
            }
          }
        })
      })
    })
  });



app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});

