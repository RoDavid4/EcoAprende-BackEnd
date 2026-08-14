import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN')
  create(@Body() createModuleDto: CreateModuleDto, @Request() req: any) {
    return this.modulesService.create(createModuleDto, req.user);
  }

  @Get()
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findAll(@Request() req: any) {
    return this.modulesService.findAll(req.user);
  }

  @Get(':id')
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.modulesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles('TEACHER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto, @Request() req: any) {
    return this.modulesService.update(id, updateModuleDto, req.user);
  }

  @Delete(':id')
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.modulesService.remove(id, req.user);
  }
}
