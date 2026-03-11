import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { CreateTemplateDTO, CreateTemplateResponseDTO } from '../dtos/CreateTemplateDTO';
import { NotificationTemplate } from '../../domain/entities/NotificationTemplate';
import { TemplateAlreadyExistsError } from '../../domain/errors/NotificationError';

export class CreateTemplateUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(dto: CreateTemplateDTO): Promise<CreateTemplateResponseDTO> {
    const existing = await this.templateRepository.findByName(dto.name);
    if (existing) throw new TemplateAlreadyExistsError(dto.name);

    const template = new NotificationTemplate({
      name: dto.name,
      channel: dto.channel,
      subject: dto.subject,
      body: dto.body,
    });

    const saved = await this.templateRepository.save(template);

    return { id: saved.id, name: saved.name, channel: saved.channel, subject: saved.subject, body: saved.body };
  }
}
