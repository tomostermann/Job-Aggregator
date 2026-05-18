import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-line bg-white/60 mt-auto">
      <div className="container-page py-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="font-display font-bold text-lg">
            {"{ Job Aggregator }"}
          </div>
          <p className="mt-2 text-slate-muted">
            Build it for real. Une plateforme d'agrégation d'offres tech
            construite par des étudiants Epitech.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-slate-ink mb-2">Produit</h3>
          <ul className="space-y-1.5 text-slate-muted">
            <li>
              <Link href="/dashboard" className="hover:text-ink-700">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/offers" className="hover:text-ink-700">
                Rechercher des offres
              </Link>
            </li>
            <li>
              <Link href="/saved" className="hover:text-ink-700">
                Favoris
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-slate-ink mb-2">Compte</h3>
          <ul className="space-y-1.5 text-slate-muted">
            <li>
              <Link href="/login" className="hover:text-ink-700">
                Se connecter
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-ink-700">
                Créer un compte
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-slate-ink mb-2">À propos</h3>
          <ul className="space-y-1.5 text-slate-muted">
            <li>Projet Epitech</li>
            <li>Données : WeLoveDevs API</li>
            <li>WCAG 2.1 AA</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
