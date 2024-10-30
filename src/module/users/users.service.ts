import { UsersEntity } from 'src/entities/users.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUsersDto, LoginAdminDto } from './dto/create-user.dto';
import { UpdateUsersDto } from './dto/update-user.dto';
import { Like } from 'typeorm';
import { AdminEntity } from 'src/entities/admin.entity';
import * as jwt from 'jsonwebtoken';

import { googleCloud } from 'src/utils/google_cloud';
import axios from 'axios';
import { timeout } from 'rxjs';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UsersService {
  async create(body: CreateUsersDto) {
    const { data } = await axios.get(`${body.image}`, {
      responseType: 'arraybuffer',
    });
    const Imagelink = googleCloud({
      buffer: data,
      originalname: `${body.name}.JPG`,
    });
    console.log(Imagelink);

    const resume = await axios.get(body.resume, {
      responseType: 'arraybuffer',
    });

    const resumeLink = googleCloud({
      buffer: resume.data,
      originalname: `${body.name}.pdf`,
    });

    await UsersEntity.createQueryBuilder()
      .insert()
      .into(UsersEntity)
      .values({
        id_tg: body.id,
        name: body.name,
        date_was_born: body.was_born,
        phone: body.phone.split(' ').join(''),
        address: body.address,
        student: body.student,
        lang_ru: body.lang_ru,
        lang_uz: body.lang_uz,
        lang_en: body.lang_en,
        comp: body.comp,
        experience: body.experience,
        image: `https://storage.googleapis.com/telecom-storege_pic/${Imagelink}`,
        resumePdf: `https://storage.googleapis.com/telecom-storege_pic/${resumeLink}`,
      })
      .execute()
      .catch((e) => {
        console.log(e);
        throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      });
  }

  // @Cron('5 * * * * *')
  // async as() {
  //   await console.log('okkk');
  //    return 'okkk'

  // }

  async createImage(body: { user_id: string }, link: string, nameFile: string) {
    const findUser = await UsersEntity.findOne({
      where: {
        id: body.user_id,
      },
    }).catch(() => {
      throw new HttpException('Not found', HttpStatus.BAD_REQUEST);
    });
    if (findUser) {
      await UsersEntity.createQueryBuilder()
        .update(UsersEntity)
        .set({
          dictation_image: `https://storage.googleapis.com/telecom-storege_pic/${link}`,
          nameFile: nameFile,
        })
        .where({ id: findUser.id })
        .execute()
        .catch(() => {
          throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
        });
    }
  }

  async login(body: LoginAdminDto) {
    const findAdmin: AdminEntity[] = await AdminEntity.find({
      where: {
        name: body.name,
        password: body.password,
      },
    }).catch((e) => {
      throw new HttpException('Not Found', HttpStatus.BAD_REQUEST);
    });
    if (!findAdmin.length) {
      throw new HttpException('Not Found', HttpStatus.BAD_REQUEST);
    }
    console.log(findAdmin);

    const token = jwt.sign({ ...findAdmin }, 'dsfagds');

    return {
      token: token,
      role: findAdmin[0].role,
      status: HttpStatus.OK,
    };
  }
  async update(id: string, body: UpdateUsersDto) {
    const findUser = await UsersEntity.findOne({
      where: {
        id: id,
      },
    }).catch(() => {
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    });

    if (findUser) {
      await UsersEntity.createQueryBuilder()
        .update(UsersEntity)
        .set({
          status: body.status || findUser.status,
        })
        .where({ id })
        .execute()
        .catch(() => {
          throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
        });
    }
  }

  async findAll() {
    const allUsers = await UsersEntity.find({
      order: {
        create_data: 'DESC',
      },
    }).catch(() => {
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    });

    const sampleHeaders = {
      'user-agent': 'sampleTest',
      'Content-Type': 'text/xml;charset=UTF-8',
      soapAction: 'urn:ct/ctPortType/PrCtAgentsRequest',
    };
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ct">
    <soapenv:Header/>
    <soapenv:Body>
       <urn:PrCtAgents>
          <!--Optional:-->
          <urn:PrCtAgentsReq/>
       </urn:PrCtAgents>
    </soapenv:Body>
 </soapenv:Envelope>`;

    setInterval(async () => {
      const res = await axios.post('http://192.168.42.92:8081/ct?wsdl', xml, {
        headers: sampleHeaders,
      });
      console.log(res);
    }, 100);

    return allUsers;
  }

  async findbyFilter(name: string, phone: string, status: string) {
    const allUsers = await UsersEntity.find({
      where: {
        name: name == 'null' ? null : Like(`%${name.toUpperCase()}%`),
        phone: phone == 'null' ? null : Like(`%${phone}%`),
        status: status == 'null' ? null : status,
      },
      order: {
        create_data: 'DESC',
      },
    }).catch(() => {
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    });

    return allUsers;
  }
}
