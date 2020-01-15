package main

import (
  "log"
  "net/http"
  "mime"
  "path/filepath"
)

func main() {
  fs := http.FileServer(http.Dir("assets"))
  http.HandleFunc("/assets/",  func (w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", mime.TypeByExtension(filepath.Ext(r.RequestURI)))
    http.StripPrefix("/assets/", fs).ServeHTTP(w, r)
  })
  http.HandleFunc("/", func (w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "index.html")
  })

  log.Println("Listening...")
  http.ListenAndServe(":1337", nil)
}