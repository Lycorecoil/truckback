export interface CreateDriverDTO {
  email:        string;
  password:     string;
  tenantId:     string;
  telephone:    string;   // requis — envoi SMS + profil fleet
  nom:          string;
  prenom:       string;
  numeroPermis: string;
}

export interface CreateDriverResponseDTO {
  id:    string;
  email: string;
  role:  'DRIVER';
}
